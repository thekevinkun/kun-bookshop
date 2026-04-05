// Import mongoose tools
import mongoose, { Schema } from "mongoose";

// AuditLog records every sensitive business action in the system
// This is separate from Winston logs — this is for business events, not app logs
const AuditLogSchema = new Schema({
  // Who performed this action — the user or admin's MongoDB _id as a string
  userId: { type: String, required: true, index: true },

  // What they did — use SCREAMING_SNAKE_CASE for consistency
  // e.g. 'ORDER_FULFILLED', 'DELETE_BOOK', 'UPDATE_USER_ROLE', 'ORDER_REFUNDED'
  action: { type: String, required: true },

  // What type of thing they acted on — e.g. 'Order', 'Book', 'User'
  resourceType: { type: String, required: true },

  // The specific ID of the thing they acted on
  resourceId: { type: String, required: true },

  // Optional snapshot of what changed — useful for forensics
  metadata: {
    before: { type: Schema.Types.Mixed, default: null }, // Value before the change
    after: { type: Schema.Types.Mixed, default: null }, // Value after the change
  },

  // The user's IP address — helps trace actions if something suspicious happens
  ipAddress: { type: String, default: null },

  // When this happened — indexed so we can query by date range
  createdAt: { type: Date, default: Date.now, index: true },
});

// Export the model
export const AuditLog = mongoose.model("AuditLog", AuditLogSchema);
