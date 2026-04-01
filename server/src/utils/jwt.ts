// Import the jsonwebtoken library so we can create and verify login tokens
import jwt from "jsonwebtoken";

// Import Node's built-in crypto module for generating random bytes and hashing
import crypto from "crypto";

// --- ACCESS TOKEN ---
// Generate a short-lived access token (15 minutes)
// This is what the user sends with every API request to prove they're logged in
export const generateAccessToken = (
  userId: string, // The user's MongoDB _id
  email: string, // The user's email address
  role: string, // Either 'user' or 'admin'
): string => {
  return jwt.sign(
    { userId, email, role }, // Data we embed inside the token
    process.env.JWT_SECRET!, // Our secret key from .env — never hardcode this
    { expiresIn: "15m" }, // Token dies in 15 minutes — limits damage if stolen
  );
};

// --- REFRESH TOKEN ---
// Generate a long-lived refresh token (30 days)
// This is NOT a JWT — it's just a random string we store in the database
// Storing it in DB means we can revoke it anytime (JWT can't be revoked)
export const generateRefreshToken = (): string => {
  // randomBytes(64) creates 64 random bytes → toString('hex') makes it a 128-char string
  // Practically impossible to guess — much safer than a predictable ID
  return crypto.randomBytes(64).toString("hex");
};

// --- HASH TOKEN ---
// Hash a token before storing it in the database
// Same idea as hashing passwords — if DB leaks, attackers get useless hashes
export const hashToken = (token: string): string => {
  // SHA-256 is a one-way hash — you can reverse-engineer the original from the hash
  return crypto.createHash("sha256").update(token).digest("hex");
};
