// chat.controller.ts — Main entry point for POST /api/chat
// Reads CHAT_MODE from env and routes to the correct handler
// mock  → chatMock.controller  (zero cost, scripted responses)
// openai → chat.service        (real OpenAI, tool calling, streaming)

// Express types
import { Request, Response } from "express";

// Mock mode handler
import { mockChatController } from "./chatMock.controller";

// Winston logger
import { logger } from "../utils/logger";

// chatController — decides which handler to use based on CHAT_MODE env var
// This is the only function registered on the route — all branching happens here
export const chatController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // Read CHAT_MODE from environment — defaults to "mock" if not set (safe default)
  const mode = process.env.CHAT_MODE ?? "mock";

  // Log which mode is being used — helps confirm the right mode is active
  logger.info(`[Chat] Mode: ${mode}`);

  if (mode === "mock") {
    // Mock mode — delegate entirely to the mock controller
    await mockChatController(req, res);
    return;
  }

  if (mode === "openai") {
    // Phase D — openAIChatController will be imported and called here
    // For now, return a clear 503 so we know this path isn't wired yet
    // When Phase D is done, replace this block with:
    //   const { openAIChatController } = await import("../services/chat.service");
    //   await openAIChatController(req, res);
    res.status(503).json({
      success: false,
      message:
        "OpenAI mode is not yet configured. Set CHAT_MODE=mock to use the chatbot.",
    });
    return;
  }

  // Unknown CHAT_MODE value — log it and return a helpful error
  logger.warn(
    `[Chat] Unknown CHAT_MODE: "${mode}". Expected "mock" or "openai".`,
  );
  res.status(500).json({
    success: false,
    message: "Chat is misconfigured. Please contact the administrator.",
  });
};
