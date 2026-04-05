// Import Zod v4 for schema validation
import { z } from "zod";

// Reusable helper from Phase 2 — Zod v4 doesn't support required_error in z.string()
// So we use .min(1) to ensure the field is not empty
const requiredString = (field: string) =>
  z.string().min(1, `${field} is required`);

// --- CREATE CHECKOUT SESSION SCHEMA ---
// Validates the body when the frontend calls POST /api/checkout/create-session
// The frontend only sends book IDs — we fetch prices from the DB ourselves (Security §4.1)
export const createSessionSchema = z.object({
  // Array of book IDs the user wants to buy — must have at least one
  items: z
    .array(
      z.object({
        // Each item only needs a bookId — price comes from our DB, never the client
        bookId: requiredString("Book ID"),
      }),
    )
    .min(1, "Cart cannot be empty"), // Reject empty cart submissions

  // Optional coupon code — trimmed and uppercased in the controller before DB lookup
  couponCode: z.string().optional(),
});

// --- VERIFY COUPON SCHEMA ---
// Validates the body when the frontend checks if a coupon is valid before checkout
export const verifyCouponSchema = z.object({
  // The coupon code the user typed in
  code: requiredString("Coupon code"),
});

// Export TypeScript types inferred from the schemas
// These are used to type req.body in the controllers
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type VerifyCouponInput = z.infer<typeof verifyCouponSchema>;
