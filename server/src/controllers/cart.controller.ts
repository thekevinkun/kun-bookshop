import { Request, Response } from "express";
import { Cart } from "../models/Cart";
import { ICartItem } from "../types/order";

// getCart — GET /api/cart
// Returns the current user's cart. Creates an empty one if it doesn't exist yet.
export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId; // Get userId from the JWT payload set by authenticate

    // findOneAndUpdate with upsert:true creates the cart if it doesn't exist yet
    // new:true returns the updated document, not the old one
    const cart = await Cart.findOneAndUpdate(
      { userId }, // Find cart belonging to this user
      { $setOnInsert: { userId, items: [], coupon: null } }, // Only set these fields on creation
      { upsert: true, new: true }, // Create if missing, return the final document
    );

    res.json({ items: cart.items, coupon: cart.coupon }); // Return items and coupon to frontend
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cart" }); // Clean error, no stack trace
  }
};

// addItem — POST /api/cart/items
// Adds a single book to the cart. Silently ignores if bookId already exists (digital goods = qty 1).
export const addItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { bookId, title, authorName, price, coverImage } =
      req.body as ICartItem;

    // Add the item only if bookId is not already in the cart
    // Then ALWAYS clear the coupon — adding a book changes the subtotal,
    // making the previously stored discountAmount and finalTotal stale
    const cart = await Cart.findOneAndUpdate(
      { userId, "items.bookId": { $ne: bookId } }, // Only if not already in cart
      {
        $push: { items: { bookId, title, authorName, price, coverImage } }, // Add item
        $set: { coupon: null }, // Always wipe coupon — total has changed
      },
      { upsert: true, new: true, returnDocument: "after" },
    );

    // If cart is null the bookId was already present — fetch current state
    const finalCart = cart ?? (await Cart.findOne({ userId }));

    res.json({ items: finalCart!.items, coupon: finalCart!.coupon });
  } catch (err) {
    res.status(500).json({ error: "Failed to add item to cart" });
  }
};

// removeItem — DELETE /api/cart/items/:bookId
// Removes a single book from the cart by bookId.
export const removeItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const bookId = req.params.bookId as string;

    const cart = await Cart.findOneAndUpdate(
      { userId },
      {
        $pull: { items: { bookId } }, // Remove the matching item
        $set: { coupon: null }, // Wipe coupon — total has changed
      },
      { new: true, returnDocument: "after" },
    );

    if (!cart) {
      res.json({ items: [], coupon: null });
      return;
    }

    res.json({ items: cart.items, coupon: cart.coupon });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove item from cart" });
  }
};

// clearCart — DELETE /api/cart
// Empties the cart and removes any applied coupon. Called after successful checkout.
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId; // Authenticated user from JWT

    // Reset items to empty array and coupon to null
    await Cart.findOneAndUpdate(
      { userId }, // Find this user's cart
      { $set: { items: [], coupon: null } }, // Clear everything
      { upsert: true }, // Create if somehow missing — no-op otherwise
    );

    res.json({ items: [], coupon: null }); // Confirm empty cart to frontend
  } catch (err) {
    res.status(500).json({ error: "Failed to clear cart" });
  }
};

// applyCoupon — POST /api/cart/coupon
// Stores the validated coupon data into the cart document.
// NOTE: coupon VALIDATION still happens in checkout.controller.ts — this just persists the result.
export const applyCoupon = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.userId; // Authenticated user from JWT

    // The frontend sends the full computed coupon object after validating with the coupon endpoint
    const { code, discountType, discountValue, discountAmount, finalTotal } =
      req.body;

    // Store the coupon object in the cart document
    const cart = await Cart.findOneAndUpdate(
      { userId }, // Find this user's cart
      {
        $set: {
          coupon: {
            code,
            discountType,
            discountValue,
            discountAmount,
            finalTotal,
          },
        },
      }, // Save coupon
      { upsert: true, new: true }, // Create cart if missing, return new doc
    );

    res.json({ items: cart!.items, coupon: cart!.coupon }); // Return full cart with coupon applied
  } catch (err) {
    res.status(500).json({ error: "Failed to apply coupon" });
  }
};

// removeCoupon — DELETE /api/cart/coupon
// Clears the applied coupon from the cart without touching items.
export const removeCoupon = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.userId; // Authenticated user from JWT

    // Set coupon back to null — items are untouched
    const cart = await Cart.findOneAndUpdate(
      { userId }, // Find this user's cart
      { $set: { coupon: null } }, // Remove the coupon
      { new: true }, // Return updated document
    );

    res.json({ items: cart?.items ?? [], coupon: null }); // Return cart without coupon
  } catch (err) {
    res.status(500).json({ error: "Failed to remove coupon" });
  }
};
