import { Router } from "express"; // Express router
import { authenticate } from "../middleware/auth.middleware"; // JWT check — sets req.user
import { getUserOrders } from "../controllers/orders.controller"; // Our new controller function

const router = Router(); // Create a new router for user-facing order routes

// GET /api/orders — returns only the logged-in user's orders
// authenticate ensures only logged-in users can see their own orders
router.get("/", authenticate, getUserOrders);

export default router;
