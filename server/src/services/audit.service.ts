// Import the AuditLog model to write entries to the database
import { AuditLog } from "../models/AuditLog";

// Import logger so we can log if the audit write itself fails
import { logger } from "../utils/logger";

// A simple function to record any important action that happens in the system
// Call this whenever an admin does something or an order changes state
export const logAuditEvent = async (params: {
  userId: string; // Who performed the action
  action: string; // What they did — e.g. 'ORDER_FULFILLED', 'DELETE_BOOK'
  resourceType: string; // What kind of thing was affected — e.g. 'Order', 'Book'
  resourceId: string; // The specific ID of that thing
  metadata?: object; // Any extra context — old/new values, amounts, etc.
  ipAddress?: string; // The user's IP address from req.ip
}) => {
  // Write the audit entry to MongoDB
  // We use .catch() instead of try/catch so a failed audit log does NOT
  // crash the main operation — we just log the failure and move on
  await AuditLog.create(params).catch((err: any) => {
    logger.error("Failed to write audit log entry", { err, params });
  });
};
