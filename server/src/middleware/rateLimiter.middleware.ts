// Import express-rate-limit to control how many requests an IP can make in a time window
import rateLimit from "express-rate-limit";

// --- GLOBAL LIMITER ---
// Applies to every route that doesn't have its own specific limiter
// 100 requests per 15 minutes is fine for normal browsing
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes expressed in milliseconds (15 × 60 × 1000)
  max: 100, // Max 100 requests per IP per window
  standardHeaders: true, // Send rate limit info in response headers (X-RateLimit-*)
  legacyHeaders: false, // Don't use the older header format
  message: {
    error: "Too many requests, please slow down.", // What we send back when limit is hit
  },
});

// --- AUTH LIMITER ---
// Much stricter — applies only to login, register, password reset routes
// Only counts FAILED requests (skipSuccessfulRequests: true)
// 10 failed attempts per 15 minutes prevents brute-force attacks
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 10, // Only 10 failed attempts allowed
  skipSuccessfulRequests: true, // A successful login doesn't count against the limit
  message: {
    error: "Too many attempts. Please wait 15 minutes before trying again.",
  },
});

// --- DOWNLOAD LIMITER ---
// Prevents bots from mass-downloading books or users from hotlinking
// 10 downloads per hour is generous for a real user, tight for a bot
export const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // Max 10 downloads per hour per IP
  message: {
    error: "Download limit reached. You can download more books in an hour.",
  },
});
