import jwt from "jsonwebtoken";
import { Request } from "express";

// This runs on every GraphQL request to extract the authenticated user
// The returned object becomes the `context` argument in every resolver
export const createContext = async ({ req }: { req: Request }) => {
  // Read token from cookie first, then fall back to Authorization header
  // This matches exactly how the REST auth middleware works
  const token =
    req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    // No token — context has no user, mutations will reject with Unauthorized
    return { user: null };
  }

  try {
    // Verify the token and attach the decoded payload as context.user
    const user = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: string;
    };
    return { user };
  } catch {
    // Invalid or expired token — treat as unauthenticated
    return { user: null };
  }
};
