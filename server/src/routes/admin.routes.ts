// Import Express Router to define our route handlers
import { Router } from "express";

// Import the authentication middleware — checks the JWT token and sets req.user
import { authenticate } from "../middleware/auth.middleware";

// Import the admin middleware — checks that req.user.role is 'admin'
import { isAdmin } from "../middleware/admin.middleware";

// Import all the controller functions we wrote in admin.controller.ts
import {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getOrders,
  getRevenue,
  getAnalytics,
  getAdminReviews,
} from "../controllers/admin.controller";

// Create a new Express router for all admin routes
const router = Router();

// Apply authenticate + isAdmin to EVERY route in this file at once
// This means we don't need to repeat them on each individual route — DRY principle
router.use(authenticate); // First: is the user logged in?
router.use(isAdmin); // Second: is the logged-in user an admin?

// Dashboard stats — four headline numbers + 5 recent orders
router.get("/stats", getStats);

// User management
router.get("/users", getUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

// Order management — all orders (not user-scoped like /api/orders)
router.get("/orders", getOrders);

// Revenue + analytics chart data
router.get("/revenue", getRevenue);
router.get("/analytics", getAnalytics);

router.get("/reviews", getAdminReviews);

export default router;
