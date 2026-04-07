// Import Request, Response, NextFunction — the three params every Express middleware receives
import { Request, Response, NextFunction } from "express";

// Import jsonwebtoken so we can verify the access token
import jwt from "jsonwebtoken";

// Define the shape of the data we embedded inside the JWT when we created it
// This tells TypeScript what fields to expect after verifying the token
interface JwtPayload {
  userId: string; // The user's MongoDB _id
  email: string; // The user's email address
  role: string; // Either 'user' or 'admin'
}

// Extend Express's Request type so we can attach the decoded user to req.user
// This lets any route handler downstream access req.user without TypeScript complaining
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload; // Optional because unauthenticated routes don't have this
    }
  }
}

// The middleware function that protects routes
// Place this before any route handler you want to lock behind authentication
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Check Authorization header FIRST — this is what our Axios interceptor sends
  // Fall back to cookie only if no header token exists
  const token =
    req.headers.authorization?.replace("Bearer ", "") || req.cookies.token;

  // If there's no token at all, the user is not logged in — reject immediately
  if (!token) {
    res.status(401).json({ error: "Access denied. Please log in." });
    return; // Stop here — don't call next()
  }

  try {
    // jwt.verify() checks two things: the signature is valid AND the token hasn't expired
    // If either check fails, it throws an error which we catch below
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Attach the decoded user data to the request object
    // Every route handler after this middleware can now access req.user
    req.user = decoded;

    // Token is valid — pass control to the next middleware or route handler
    next();
  } catch (error) {
    // jwt.verify() threw — token is either expired, tampered with, or malformed
    res
      .status(401)
      .json({ error: "Invalid or expired token. Please log in again." });
  }
};
