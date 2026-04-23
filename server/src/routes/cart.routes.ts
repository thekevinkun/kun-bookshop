import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getCart,
  addItem,
  removeItem,
  clearCart,
  applyCoupon,
  removeCoupon,
} from "../controllers/cart.controller";

const router = Router(); // Create a new router instance

// All cart routes require authentication — cart is always user-scoped
router.use(authenticate); // Apply authenticate middleware to every route in this router

// GET /api/cart — fetch the user's current cart
router.get("/", getCart);

// POST /api/cart/items — add a book to cart
router.post("/items", addItem);

// DELETE /api/cart/items/:bookId — remove one book
router.delete("/items/:bookId", removeItem);

// DELETE /api/cart — empty the entire cart (post-checkout)
router.delete("/", clearCart);

// POST /api/cart/coupon — save applied coupon to cart
router.post("/coupon", applyCoupon);

// DELETE /api/cart/coupon — remove coupon from cart
router.delete("/coupon", removeCoupon);

// Export for registration in server.ts
export default router;
