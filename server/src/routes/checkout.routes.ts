// Import Express router to define our routes
import { Router } from "express";

// Import the controller function that handles checkout session creation
import {
  createCheckoutSession,
  verifySession,
} from "../controllers/checkout.controller";

// Import auth middleware — only logged-in users can checkout
import { authenticate } from "../middleware/auth.middleware";

// Import validation middleware helper and our checkout schema
import { createSessionSchema } from "../validators/order.validator";
import { z } from "zod";
import { Request, Response, NextFunction } from "express";

const router = Router();

// Inline validation middleware — same pattern used in auth routes (Phase 2)
// Validates req.body against the given Zod schema before passing to the controller
const validate =
  (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // Return all validation errors so the frontend can show them
      return res.status(400).json({
        errors: result.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    // Replace req.body with the cleaned/transformed data from Zod
    req.body = result.data;
    next();
  };

// POST /api/checkout/create-session
// Creates a Stripe checkout session and returns the redirect URL
// Must be logged in — we need the user's ID and email for the session
router.post(
  "/create-session",
  authenticate, // First: verify JWT
  validate(createSessionSchema), // Second: validate request body
  createCheckoutSession, // Third: create the Stripe session
);

// GET /api/checkout/verify-session?session_id=xxx
// Called by the frontend success page to confirm the payment went through
// We do NOT fulfill the order here — that's the webhook's job
router.get("/verify-session", authenticate, verifySession);

export default router;
