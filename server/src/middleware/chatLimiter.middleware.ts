// chatLimiter.middleware.ts — Rate limiter specific to /api/chat
// Separate from the global limiter — chat gets its own stricter cap
// 20 messages per minute per IP to prevent quota abuse and spam

import rateLimit from "express-rate-limit"; // express-rate-limit: creates rate limiting middleware

// Create a rate limiter specifically for the chat endpoint
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 60 seconds — the sliding window for counting requests
  max: 20, // Maximum 20 requests per IP within the window

  // skip: bypass the limiter entirely during automated tests
  // process.env.NODE_ENV === "test" is set by Vitest when running the test suite
  skip: () => process.env.NODE_ENV === "test",

  // standardHeaders: true — sends RateLimit-* headers so the client knows its limit
  standardHeaders: true,

  // legacyHeaders: false — disables the old X-RateLimit-* headers (not needed)
  legacyHeaders: false,

  // message sent back when the limit is exceeded
  message: {
    success: false,
    message: "Too many messages. Please wait a moment before trying again.",
  },
});
