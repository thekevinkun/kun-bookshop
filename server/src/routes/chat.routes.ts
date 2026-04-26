// chat.routes.ts — Route definition for POST /api/chat
// Applies rate limiting and input sanitization before the controller

// Express types
import { Router, Request, Response, NextFunction } from "express";

// Main chat handler
import { chatController } from "../controllers/chat.controller";

// 20 req/min per IP
import { chatLimiter } from "../middleware/chatLimiter.middleware";

// Create a new Express router instance
const router = Router();

// Inline sanitizer middleware
// Runs on every POST /api/chat request before it reaches the controller
// Two jobs: strip HTML tags, enforce 500-char max on the last user message
const sanitizeChatInput = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Pull the messages array from the request body
  const { messages } = req.body;

  // If messages is missing or not an array, reject early with a clear error
  if (!Array.isArray(messages) || messages.length === 0) {
    res
      .status(400)
      .json({ success: false, message: "messages must be a non-empty array." });
    return;
  }

  // Sanitize every message in the array — not just the last one
  // This prevents injecting HTML/scripts through older messages in the history
  req.body.messages = messages.map(
    (msg: { role: string; content: string }) => ({
      role: msg.role,

      // Step 1 — strip HTML tags: replace anything matching <...> with empty string
      // Step 2 — trim whitespace from both ends
      // Step 3 — cap at 500 characters to prevent token abuse
      content: String(msg.content ?? "")
        .replace(/<[^>]*>/g, "") // Remove HTML tags (e.g. <script>, <b>, <img ...>)
        .trim() // Remove leading/trailing whitespace
        .slice(0, 500), // Hard cap — no message longer than 500 chars reaches OpenAI
    }),
  );

  next(); // Input is clean — pass control to the controller
};

// POST /api/chat
// chatLimiter runs first  → rejects if IP has exceeded 20 req/min
// sanitizeChatInput runs second → cleans the body
// chatController runs last → handles mock or openai mode
router.post("/", chatLimiter, sanitizeChatInput, chatController);

export default router;
