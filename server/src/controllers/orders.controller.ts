import { Request, Response } from "express"; // Express types for req and res
import { Order } from "../models/Order"; // Order Mongoose model
import { logger } from "../utils/logger"; // Winston logger — never send stack traces to client

// getUserOrders — GET /api/orders
// Returns only the orders belonging to the currently logged-in user.
// This is different from GET /api/admin/orders which returns ALL orders across all users.
export const getUserOrders = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Read the logged-in user's ID from req.user — set by the authenticate middleware
    const userId = req.user!.userId; // Non-null assertion: authenticate guarantees this exists

    // Fetch all orders where userId matches the logged-in user
    // Sorted newest first so the most recent purchase appears at the top
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 }) // Newest first — most relevant to the user
      .lean(); // Plain JS objects — faster than full Mongoose documents

    // Return the orders array — frontend doesn't need pagination here (users rarely have 100+ orders)
    res.json({ orders });
  } catch (error) {
    logger.error("getUserOrders error", { error }); // Log full error internally
    res.status(500).json({ error: "Failed to fetch orders" }); // Safe message to client
  }
};
