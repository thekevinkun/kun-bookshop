// Import mongoose tools
import mongoose, { Schema } from "mongoose";

// This collection tracks every Stripe webhook event we've already handled
// Before we process any webhook, we insert the event ID here first
// If the insert fails with a duplicate key error, we know we already processed it — skip it
// This prevents the same order from being fulfilled twice if Stripe retries the webhook
const ProcessedEventSchema = new Schema({
  // Stripe's unique ID for every event (e.g. 'evt_1MqLiJLkdIwHu7ix...')
  // Marked unique so MongoDB rejects any attempt to insert the same ID twice
  stripeEventId: {
    type: String,
    required: true,
    unique: true,
  },

  // The type of event — helpful for debugging (e.g. 'checkout.session.completed')
  eventType: {
    type: String,
    required: true,
  },

  // When we processed it — used for the auto-delete TTL index below
  processedAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-delete processed event records after 30 days
// They're only needed to prevent duplicate processing — after 30 days Stripe won't retry anyway
ProcessedEventSchema.index(
  { processedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }, // 30 days in seconds
);

// Export the model
export const ProcessedEvent = mongoose.model(
  "ProcessedEvent",
  ProcessedEventSchema,
);
