// Import Zod
import { z } from "zod";

const requiredString = (field: string) =>
  z.string().min(1, `${field} is required`);

// MongoDB ObjectId is exactly 24 hex characters
// We validate the format here so malformed IDs never reach Mongoose
const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid book ID format");

export const createSessionSchema = z.object({
  // Each item must have a valid 24-character MongoDB ObjectId as bookId
  items: z
    .array(
      z.object({
        bookId: objectIdSchema,
      }),
    )
    .min(1, "Cart cannot be empty"),

  couponCode: z.string().optional(),
});

export const verifyCouponSchema = z.object({
  code: requiredString("Coupon code"),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type VerifyCouponInput = z.infer<typeof verifyCouponSchema>;
