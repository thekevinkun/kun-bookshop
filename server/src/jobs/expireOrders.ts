import { Order } from "../models/Order";
import { logger } from "../utils/logger";

// Marks orders as 'cancelled' if they've been pending for more than 24 hours
// (Stripe sessions expire after 24h, so these will never be completed)
export const expireStaleOrders = async (): Promise<void> => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  const result = await Order.updateMany(
    {
      paymentStatus: "pending",
      createdAt: { $lt: cutoff }, // Older than 24 hours
    },
    {
      paymentStatus: "failed",
    },
  );

  if (result.modifiedCount > 0) {
    logger.info(`Expired ${result.modifiedCount} stale pending orders`);
  }
};
