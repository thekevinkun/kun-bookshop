// Import Express types for the middleware signature
import { Request, Response, NextFunction } from "express";

// This middleware must always run AFTER authenticate middleware
// It checks that the logged-in user is actually an admin
// Usage in routes: router.post('/admin-only', authenticate, isAdmin, controller)
export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // req.user is set by the authenticate middleware that runs before this
  // If somehow it's missing here, something went very wrong — reject
  if (!req.user) {
    res.status(401).json({ error: "Access denied. Please log in." });
    return;
  }

  // Check the role that was embedded in the JWT when the user logged in
  // Only 'admin' role can pass through this gate
  if (req.user.role !== "admin") {
    // Use 403 Forbidden (not 404) — we acknowledge the route exists but they can't use it
    res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
    return;
  }

  // User is an admin — let them through to the route handler
  next();
};
