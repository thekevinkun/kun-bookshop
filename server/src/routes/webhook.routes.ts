// Import Express router
import { Router } from "express";

// Import the webhook handler controller
import { handleStripeWebhook } from "../controllers/webhook.controller";

const router = Router();

// POST /api/webhooks/stripe
// Stripe calls this after every payment event
// CRITICAL: We do NOT use express.json() on this route
// Stripe needs the RAW body to verify the webhook signature
// The raw body middleware is applied directly here using express.raw()
// This must be done at the route level, NOT in server.ts globally
router.post(
  "/stripe",
  // express.raw() gives us the unparsed body as a Buffer
  // type: '*/*' accepts any content type Stripe might send
  (req, res, next) => {
    // If the body is already a Buffer (raw), skip — already handled
    if (Buffer.isBuffer(req.body)) return next();
    // Otherwise apply express.raw() to parse the body as a raw Buffer
    return require("express").raw({ type: "*/*" })(req, res, next);
  },
  handleStripeWebhook,
);

export default router;
