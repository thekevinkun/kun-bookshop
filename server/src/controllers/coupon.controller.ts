// Import the Request and Response types from Express for TypeScript type safety
import { Request, Response } from "express";

// Import models
import { User } from "../models/User";
import { Coupon } from "../models/Coupon";
import { Order } from "../models/Order";

import { sendCouponBlast } from "../services/email.service";

// Import logger
import { logger } from "../utils/logger";

// POST /api/coupons/validate
// Public-ish: requires authenticate middleware so we know who the user is.
// Body: { code: string, cartTotal: number }
// Returns: { coupon: { code, discountType, discountValue, maxDiscount }, discountAmount, finalTotal }
export const validateCoupon = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // Pull the coupon code and cartTotal out of the request body
  const { code, cartTotal } = req.body as { code: string; cartTotal: number };

  // Make sure both fields are present — we need them to calculate the discount
  if (!code || cartTotal === undefined) {
    res.status(400).json({ error: "Coupon code and cart total are required" });
    return;
  }

  // Normalise the code to uppercase so users can type "save20" or "SAVE20"
  const normalisedCode = String(code).toUpperCase().trim();

  // Look up the coupon in the database
  const coupon = await Coupon.findOne({ code: normalisedCode });

  // If no coupon found, return a 404
  if (!coupon) {
    res.status(404).json({ error: "Coupon code not found" });
    return;
  }

  // Check whether the coupon is still active (admin can disable coupons)
  if (!coupon.isActive) {
    res.status(400).json({ error: "This coupon is no longer active" });
    return;
  }

  // Check whether the coupon's validity window covers today
  const now = new Date();
  if (now < coupon.validFrom) {
    res.status(400).json({ error: "This coupon is not valid yet" });
    return;
  }
  if (now > coupon.validUntil) {
    res.status(400).json({ error: "This coupon has expired" });
    return;
  }

  // Check whether the global usage limit has been reached
  if (coupon.usedCount >= coupon.usageLimit) {
    res.status(400).json({ error: "This coupon has reached its usage limit" });
    return;
  }

  // Check whether the cart meets the minimum purchase requirement
  if (cartTotal < (coupon.minPurchase ?? 0)) {
    res.status(400).json({
      error: `Minimum purchase of $${coupon.minPurchase?.toFixed(2)} required for this coupon`,
    });
    return;
  }

  // CHECK PER-USER COUPON USAGE
  // Look for any completed order from this user that already used this coupon
  // We check paymentStatus 'completed' — a pending/failed order doesn't count as "used"
  const userId = req.user!.userId; // req.user is set by the authenticate middleware
  const previousUse = await Order.findOne({
    userId,
    couponCode: normalisedCode,
    paymentStatus: "completed",
  });

  if (previousUse) {
    res
      .status(400)
      .json({ error: "You have already used this coupon on a previous order" });
    return;
  }

  // Calculate the discount amount
  let discountAmount: number;

  if (coupon.discountType === "percentage") {
    // e.g. 20% off a $50 cart = $10 off
    discountAmount = (cartTotal * coupon.discountValue) / 100;

    // If the coupon has a maxDiscount cap, clamp the discount to it
    // e.g. if maxDiscount is $15 and we calculated $20 off, use $15 instead
    if (
      coupon.maxDiscount !== undefined &&
      discountAmount > coupon.maxDiscount
    ) {
      discountAmount = coupon.maxDiscount;
    }
  } else {
    // Fixed discount — e.g. $5 off any order
    // But never discount more than the cart total (can't go negative)
    discountAmount = Math.min(coupon.discountValue, cartTotal);
  }

  // Round to 2 decimal places to avoid floating-point weirdness like $9.999999
  discountAmount = Math.round(discountAmount * 100) / 100;

  // Calculate what the user will actually pay
  const finalTotal = Math.round((cartTotal - discountAmount) * 100) / 100;

  // Return the validated coupon details and the calculated savings
  // We send back only what the frontend needs — not the full coupon document
  res.status(200).json({
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount,
    },
    discountAmount, // How much money the coupon saves
    finalTotal, // What the user pays after the discount
  });
};

// GET /api/admin/coupons
// Admin only. Returns all coupons sorted newest first.
export const getCoupons = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  // Fetch all coupons, newest first — admins want to see the latest ones at the top
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();

  res.status(200).json({ coupons });
};

// POST /api/admin/coupons
// Admin only. Creates a new coupon.
// Body: { code, discountType, discountValue, minPurchase?, maxDiscount?, validFrom, validUntil, usageLimit }
export const createCoupon = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    code,
    discountType,
    discountValue,
    minPurchase,
    maxDiscount,
    validFrom,
    validUntil,
    usageLimit,
  } = req.body as {
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    minPurchase?: number;
    maxDiscount?: number;
    validFrom: string;
    validUntil: string;
    usageLimit: number;
  };

  // Basic presence check — Zod validation will be added in the route layer
  if (
    !code ||
    !discountType ||
    discountValue === undefined ||
    !validFrom ||
    !validUntil ||
    !usageLimit
  ) {
    res.status(400).json({ error: "Missing required coupon fields" });
    return;
  }

  // Check if a coupon with this code already exists (code is unique in the schema)
  const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (existing) {
    res
      .status(409)
      .json({ error: `Coupon code "${code.toUpperCase()}" already exists` });
    return;
  }

  // Create and save the new coupon
  const coupon = await Coupon.create({
    code,
    discountType,
    discountValue,
    minPurchase: minPurchase ?? 0,
    maxDiscount, // Optional — undefined means no cap
    validFrom: new Date(validFrom),
    validUntil: new Date(validUntil),
    usageLimit,
    usedCount: 0, // Always starts at zero
    isActive: true, // Active by default
  });

  res.status(201).json({ coupon });
};

// PATCH /api/admin/coupons/:id
// Admin only. Updates a coupon (e.g. toggle isActive, extend validUntil).
export const updateCoupon = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // Get the coupon ID from the URL parameter
  const { id } = req.params as { id: string };

  // Find the coupon and apply the updates from the request body
  // { new: true } returns the updated document instead of the old one
  const coupon = await Coupon.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  // If not found, return 404
  if (!coupon) {
    res.status(404).json({ error: "Coupon not found" });
    return;
  }

  res.status(200).json({ coupon });
};

// DELETE /api/admin/coupons/:id
// Admin only. Hard deletes a coupon. (Prefer deactivating via PATCH isActive: false in practice.)
export const deleteCoupon = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params as { id: string };

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) {
    res.status(404).json({ error: "Coupon not found" });
    return;
  }

  res.status(200).json({ message: "Coupon deleted successfully" });
};

// POST /api/admin/coupons/:id/email-blast
// Admin only. Sends the coupon email to every verified user in the database.
// Uses a for-loop (not Promise.all) to avoid overwhelming the mail server.
export const emailBlastCoupon = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params as { id: string };

  // Find the coupon we're blasting
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    res.status(404).json({ error: "Coupon not found" });
    return;
  }

  // Only allow blasting active coupons — no point emailing an expired/inactive one
  if (!coupon.isActive) {
    res.status(400).json({ error: "Cannot blast an inactive coupon" });
    return;
  }

  // Fetch all verified users — only send to users who confirmed their email
  // .lean() returns plain objects which is faster since we only need email + firstName
  const users = await User.find({ isVerified: true })
    .select("email firstName")
    .lean();

  if (users.length === 0) {
    res.status(200).json({ message: "No verified users to send to", sent: 0 });
    return;
  }

  // Track success and failure counts to report back to the admin
  let sent = 0;
  let failed = 0;

  // Sequential loop — slower than Promise.all but prevents SMTP rate limiting
  // Most mail providers reject bursts of 100+ concurrent connections
  for (const user of users) {
    try {
      await sendCouponBlast(user.email, user.firstName, coupon);
      sent++;
    } catch (err) {
      // Log the individual failure but keep going — one bad email shouldn't stop the blast
      logger.error("Failed to send coupon blast to user", {
        email: user.email,
        err,
      });
      failed++;
    }
  }

  logger.info("Coupon email blast completed", {
    couponCode: coupon.code,
    sent,
    failed,
  });

  res.status(200).json({
    message: `Coupon blast complete. Sent: ${sent}, Failed: ${failed}`,
    sent,
    failed,
  });
};
