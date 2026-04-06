// Import Express types for request and response objects
import { Request, Response } from "express";

// Import the Mongoose models we need to query the database
import { User } from "../models/User";
import { Book } from "../models/Book";
import { Order } from "../models/Order";

// Import the logger so we can log errors without exposing stack traces to the client
import { logger } from "../utils/logger";

// Import the audit logger so we can record sensitive admin actions
import { logAuditEvent } from "../services/audit.service";

// 1. getStats — GET /api/admin/stats
// Returns the four headline numbers shown on the dashboard,
// plus a list of the 5 most recent orders.
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Run all four count/aggregate queries at the same time using Promise.all
    // This is faster than running them one by one with sequential awaits
    const [revenueResult, totalBooks, totalUsers, totalOrders, recentOrders] =
      await Promise.all([
        // Aggregate total revenue — sum the 'total' field across all completed orders
        Order.aggregate([
          { $match: { paymentStatus: "completed" } }, // Only count paid orders
          { $group: { _id: null, total: { $sum: "$total" } } }, // Add up all totals
        ]),

        // Count how many books are currently active (not soft-deleted)
        Book.countDocuments({ isActive: true }),

        // Count all registered users regardless of role
        User.countDocuments(),

        // Count only completed (paid) orders
        Order.countDocuments({ paymentStatus: "completed" }),

        // Fetch the 5 most recent orders with basic user info attached
        Order.find()
          .sort({ createdAt: -1 }) // Newest first
          .limit(5) // Only 5 results
          .populate("userId", "firstName lastName email") // Join user name + email from User collection
          .lean(), // Return plain JS objects (faster than Mongoose documents)
      ]);

    // revenueResult is an array — grab the first element, or default to 0 if no orders exist
    const totalRevenue = revenueResult[0]?.total ?? 0;

    // Send back all the stats in one response object
    res.json({
      totalRevenue,
      totalBooks,
      totalUsers,
      totalOrders,
      recentOrders,
    });
  } catch (error) {
    // Log the full error on the server but only send a clean message to the client
    logger.error("getStats error", { error });
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

// 2. getUsers — GET /api/admin/users
// Returns a paginated list of ALL users.
// Supports optional ?search= to filter by email or name.
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Read pagination params from the query string, with safe defaults
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Read the optional search string from the query
    const search = req.query.search as string | undefined;

    // Build the MongoDB filter — if search is provided, match on email or name
    const filter = search
      ? {
          $or: [
            { email: { $regex: search, $options: "i" } }, // Case-insensitive email match
            { firstName: { $regex: search, $options: "i" } }, // Case-insensitive first name match
            { lastName: { $regex: search, $options: "i" } }, // Case-insensitive last name match
          ],
        }
      : {}; // No search — return all users

    // Fetch users — NEVER include password or sensitive token fields in the response
    const users = await User.find(filter)
      .select("-password -resetPasswordToken -verificationToken") // Exclude sensitive fields
      .sort({ createdAt: -1 }) // Newest accounts first
      .skip((page - 1) * limit) // Skip records for previous pages
      .limit(limit) // Return only this page's records
      .lean();

    // Count total matching users so the frontend can calculate total pages
    const total = await User.countDocuments(filter);

    res.json({
      users,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    logger.error("getUsers error", { error });
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// 3. updateUserRole — PUT /api/admin/users/:id/role
// Toggles a user between 'user' and 'admin' roles.
// Includes a self-protection guard so an admin cannot demote themselves.
export const updateUserRole = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Safety guard — prevent an admin from changing their own role
    // This stops them from accidentally locking themselves out
    if (req.params.id === req.user!.userId) {
      res.status(400).json({ error: "You cannot change your own role" });
      return;
    }

    // Read the new role from the request body
    const { role } = req.body;

    // Validate that the incoming role is one of our two allowed values
    if (!["user", "admin"].includes(role)) {
      res.status(400).json({ error: "Role must be either user or admin" });
      return;
    }

    // Update the user's role and return the updated document (new: true)
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }, // Return the document AFTER the update, not before
    )
      .select("-password") // Never return the password
      .lean();

    // If no user was found with that ID, return a 404
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Record this role change in the audit log for compliance and traceability
    await logAuditEvent({
      userId: req.user!.userId, // The admin who made the change
      action: "UPDATE_USER_ROLE", // What happened
      resourceType: "User", // What type of thing was changed
      resourceId: req.params.id as string, // Which user was changed
      metadata: { after: { role } }, // What the new role is
      ipAddress: req.ip, // Admin's IP address
    });

    res.json({ user });
  } catch (error) {
    logger.error("updateUserRole error", { error });
    res.status(500).json({ error: "Failed to update user role" });
  }
};

// 4. deleteUser — DELETE /api/admin/users/:id
// Hard-deletes a user account.
// Includes a self-protection guard so an admin cannot delete themselves.
export const deleteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Safety guard — prevent an admin from deleting their own account
    if (req.params.id === req.user!.userId) {
      res.status(400).json({ error: "You cannot delete your own account" });
      return;
    }

    // Delete the user and get the deleted document back (so we can log it)
    const user = await User.findByIdAndDelete(req.params.id).lean();

    // If no user was found, return 404
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Log the deletion AFTER we confirm the user existed
    // We capture email + role so the audit trail has useful info even after the doc is gone
    await logAuditEvent({
      userId: req.user!.userId,
      action: "DELETE_USER",
      resourceType: "User",
      resourceId: req.params.id as string,
      metadata: {
        before: { email: (user as any).email, role: (user as any).role },
      },
      ipAddress: req.ip,
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    logger.error("deleteUser error", { error });
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// 5. getOrders — GET /api/admin/orders
// Returns ALL orders across ALL users (unlike /api/orders which is user-scoped).
// Supports ?page, ?limit, ?status filters.
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    // Read pagination and filter params from the query string
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    // Build the filter — include paymentStatus filter only when provided
    const filter: Record<string, any> = {};
    if (status) filter.paymentStatus = status; // e.g. 'completed', 'pending', 'failed'

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 }) // Newest first
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "firstName lastName email") // Attach user name + email
      .lean();

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    logger.error("getOrders error", { error });
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// 6. getRevenue — GET /api/admin/revenue
// Returns daily revenue totals for the past N days.
// Used by the Recharts line/bar chart on the dashboard.
// Supports ?days=7 | ?days=30 | ?days=90 (default 30)
export const getRevenue = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // How many days back to report — defaults to 30 if not provided
    const days = parseInt(req.query.days as string) || 30;

    // Calculate the start date by subtracting `days` from today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // MongoDB aggregation pipeline:
    // 1. Filter to completed orders within the date range
    // 2. Group by calendar day (YYYY-MM-DD)
    // 3. Sum revenue and count orders per day
    // 4. Sort chronologically so the chart renders left-to-right
    const revenueData = await Order.aggregate([
      {
        $match: {
          paymentStatus: "completed", // Only count paid orders
          createdAt: { $gte: startDate }, // Only within our date window
        },
      },
      {
        $group: {
          _id: {
            // Format the date as YYYY-MM-DD so each day becomes its own bucket
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$total" }, // Total revenue for this day
          orders: { $sum: 1 }, // Number of orders this day
        },
      },
      { $sort: { _id: 1 } }, // Sort oldest to newest (left-to-right on chart)
    ]);

    // Rename _id to date for cleaner frontend consumption
    const formatted = revenueData.map((d) => ({
      date: d._id,
      revenue: d.revenue,
      orders: d.orders,
    }));

    res.json({ revenueData: formatted, days });
  } catch (error) {
    logger.error("getRevenue error", { error });
    res.status(500).json({ error: "Failed to fetch revenue data" });
  }
};

// 7. getAnalytics — GET /api/admin/analytics
// Returns three datasets in one call:
// - Top 10 best-selling books
// - Revenue broken down by book category
// - Top 10 customers by total spend
export const getAnalytics = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Run all three aggregations in parallel — faster than sequential awaits
    const [topBooks, salesByCategory, topCustomers] = await Promise.all([
      // Top 10 best-selling books sorted by how many times they've been purchased
      Book.find({ isActive: true })
        .sort({ purchaseCount: -1 })
        .limit(10)
        .select("title authorName coverImage purchaseCount price")
        .lean(),

      // Revenue and order count grouped by book category
      Order.aggregate([
        { $match: { paymentStatus: "completed" } },
        { $unwind: "$items" }, // Flatten items array — one document per item
        {
          $lookup: {
            // Join each item to its Book document
            from: "books",
            localField: "items.bookId",
            foreignField: "_id",
            as: "bookData",
          },
        },
        { $unwind: "$bookData" }, // Flatten the joined book array
        { $unwind: "$bookData.category" }, // Each category tag becomes its own row
        {
          $group: {
            _id: "$bookData.category", // Group by category name
            revenue: { $sum: "$items.price" },
            count: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } }, // Highest revenue category first
        { $limit: 10 },
      ]),

      // Top 10 customers ranked by how much they've spent in total
      Order.aggregate([
        { $match: { paymentStatus: "completed" } },
        {
          $group: {
            _id: "$userId", // Group by user
            totalSpent: { $sum: "$total" }, // Sum all their order totals
            orderCount: { $sum: 1 }, // Count how many orders they've made
          },
        },
        { $sort: { totalSpent: -1 } }, // Biggest spenders first
        { $limit: 10 },
        {
          $lookup: {
            // Join each userId to the User collection to get their name
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" }, // Flatten the joined user array
        {
          $project: {
            // Only return the fields we actually need
            totalSpent: 1,
            orderCount: 1,
            firstName: "$user.firstName",
            lastName: "$user.lastName",
            email: "$user.email",
          },
        },
      ]),
    ]);

    res.json({ topBooks, salesByCategory, topCustomers });
  } catch (error) {
    logger.error("getAnalytics error", { error });
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};
