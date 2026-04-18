// Import the Express Router — this lets us define route handlers separately from server.ts
import { Router } from "express";

// Import the controller functions we just wrote
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  emailBlastCoupon,
  getActiveCoupons,
} from "../controllers/coupon.controller";

// Import auth middlewares — authenticate checks JWT, isAdmin checks the role field
import { authenticate } from "../middleware/auth.middleware";
import { isAdmin } from "../middleware/admin.middleware";

// Create a new router instance for coupon-related routes
const router = Router();

// User-facing route
// POST /api/coupons/validate
// Requires authenticate so we know who is applying the coupon
// (useful later if we want per-user usage limits)
router.post("/validate", authenticate, validateCoupon);

// GET /api/coupons/active — public, no auth required
// Returns currently valid coupons for the homepage banner
router.get("/active", getActiveCoupons);

// Admin-only routes
// Both authenticate AND isAdmin are required — must be logged in AND be an admin

// GET /api/admin/coupons — list all coupons
router.get("/", authenticate, isAdmin, getCoupons);

// POST /api/admin/coupons — create a new coupon
router.post("/", authenticate, isAdmin, createCoupon);

// PATCH /api/admin/coupons/:id — update a coupon (toggle active, extend expiry, etc.)
router.patch("/:id", authenticate, isAdmin, updateCoupon);

// DELETE /api/admin/coupons/:id — permanently delete a coupon
router.delete("/:id", authenticate, isAdmin, deleteCoupon);

// POST /api/admin/coupons/:id/email-blast — send coupon to all verified users
router.post("/:id/email-blast", authenticate, isAdmin, emailBlastCoupon);

// Export the router so server.ts can mount it
export default router;
