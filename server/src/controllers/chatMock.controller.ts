// Mock mode controller for KUN chatbot
// Zero OpenAI calls, zero DB calls — pure scripted responses
// Used during development and testing to validate the full
// streaming pipeline without spending any API credits

// Express types
import { Request, Response } from "express";

// Our chat types
import { ChatRequest, ChatStreamChunk } from "../types/chat";

// Import our logger — never use console.log in this project
import { logger } from "../utils/logger";

// Helper: write a single SSE chunk to the response stream
// SSE format requires "data: <json>\n\n" — the double newline signals end of event
const writeChunk = (res: Response, chunk: ChatStreamChunk) => {
  res.write(`data: ${JSON.stringify(chunk)}\n\n`); // Write the serialized chunk to the stream
};

// Helper: simulate streaming by sending text word-by-word with a small delay
// This makes mock mode feel exactly like real OpenAI streaming to the frontend
const streamText = async (res: Response, text: string): Promise<void> => {
  const words = text.split(" "); // Split the response into individual words

  for (const word of words) {
    // Send each word as a token chunk, re-adding the space that split() removed
    writeChunk(res, { token: word + " " });

    // Wait 40ms between words — mimics real streaming speed without being too slow
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
};

// Keyword matcher — checks if the user message contains any of the given keywords
// case-insensitive so "DUNE" and "dune" both match
const contains = (message: string, keywords: string[]): boolean => {
  const lower = message.toLowerCase(); // Normalize to lowercase for comparison
  return keywords.some((kw) => lower.includes(kw)); // Return true if any keyword matches
};

// Pick a scripted mock response based on what the user said
// Returns a plain string — streamText handles the actual streaming
const getMockResponse = (
  userMessage: string,
  firstName: string | null,
): string => {
  // Greeting / hello
  if (contains(userMessage, ["hello", "hi", "hey", "halo", "hei"])) {
    const name = firstName ? ` ${firstName}` : ""; // Personalize if we know the user's name
    return `Hi${name}! I'm KUN, your Kun Bookshop assistant. I can help you find books, answer questions, or manage your cart and library. What can I do for you?`;
  }

  // Book search
  if (
    contains(userMessage, [
      "find",
      "search",
      "look for",
      "cari",
      "book",
      "buku",
    ])
  ) {
    return `I found some books that might interest you! Here are a few results:\n\n📖 **Dune** by Frank Herbert — $12.99\n📖 **The Hobbit** by J.R.R. Tolkien — $9.99\n📖 **1984** by George Orwell — $8.99\n\nWould you like to add any of these to your cart, or would you like more details on a specific book?`;
  }

  // Add to cart
  if (
    contains(userMessage, [
      "add to cart",
      "add it",
      "tambah",
      "cart",
      "keranjang",
    ])
  ) {
    return `I've added that book to your cart! 🛒 You can view your cart anytime by clicking the cart icon, or just ask me "show my cart".`;
  }

  // View cart
  if (
    contains(userMessage, [
      "my cart",
      "show cart",
      "view cart",
      "keranjang saya",
    ])
  ) {
    return `Here's what's in your cart right now:\n\n🛒 **Dune** by Frank Herbert — $12.99\n\nSubtotal: $12.99\n\nWant to apply a coupon, or are you ready to checkout?`;
  }

  // Library / purchased books
  if (
    contains(userMessage, [
      "my library",
      "my books",
      "purchased",
      "library",
      "perpustakaan",
    ])
  ) {
    return `Here are the books in your library:\n\n📚 **The Great Gatsby** by F. Scott Fitzgerald\n📚 **To Kill a Mockingbird** by Harper Lee\n\nYou can read PDF books directly in your browser, or download ePub books to your reader app.`;
  }

  // Orders
  if (
    contains(userMessage, ["my orders", "order history", "pesanan", "order"])
  ) {
    return `Here's your recent order history:\n\n📦 **Order #ORD-001** — $12.99 — Completed\nPlaced 3 days ago — 1 book\n\nNeed help with a specific order?`;
  }

  // Coupon / discount
  if (
    contains(userMessage, [
      "coupon",
      "discount",
      "promo",
      "kode",
      "diskon",
      "voucher",
    ])
  ) {
    return `I can check a coupon for you! Just give me the coupon code and I'll validate it. For example: "Check coupon WELCOME10".`;
  }

  // Download / format questions
  if (contains(userMessage, ["download", "format", "pdf", "epub", "how to"])) {
    return `Great question! Here's how downloads work at Kun Bookshop:\n\n📄 **PDF books** — Read directly in your browser, or download for offline use. Download links are valid for 1 hour.\n📱 **ePub books** — Download and open in your favourite reading app (Apple Books, Kindle, etc.).\n\nAll downloads are instant after purchase!`;
  }

  // Payment / Stripe
  if (
    contains(userMessage, ["payment", "pay", "stripe", "bayar", "checkout"])
  ) {
    return `Payments at Kun Bookshop are processed securely by Stripe — one of the world's most trusted payment platforms. We accept all major credit and debit cards. Your card details are never stored on our servers.`;
  }

  // Refund / return
  if (
    contains(userMessage, ["refund", "return", "refund policy", "pengembalian"])
  ) {
    return `Since all our books are digital products, we generally don't offer refunds after a successful download. However, if you experienced a technical issue with your purchase, please contact us and we'll do our best to help!`;
  }

  // Wishlist
  if (
    contains(userMessage, [
      "wishlist",
      "wish list",
      "save",
      "bookmark",
      "favorit",
    ])
  ) {
    return `I've added that book to your wishlist! 💛 You can find all your saved books in your account under "Wishlist".`;
  }

  // Off-topic — redirect politely
  if (
    contains(userMessage, [
      "weather",
      "politics",
      "sport",
      "football",
      "cuaca",
      "berita",
      "news",
    ])
  ) {
    return `Ha, I wish I could help with that! But I'm KUN — I'm only able to assist with things related to Kun Bookshop. Is there a book I can help you find, or a question about your account?`;
  }

  // Default fallback — friendly and helpful
  return `I'm not quite sure I understood that. I can help you:\n\n🔍 **Find books** — just tell me what you're looking for\n🛒 **Manage your cart** — add, remove, or view items\n📚 **Check your library** — see your purchased books\n❓ **Answer questions** — downloads, formats, payments, coupons\n\nWhat would you like to do?`;
};

// mockChatController — main handler for POST /api/chat in mock mode
// Sets SSE headers, streams a scripted response, then closes the stream
export const mockChatController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Pull the request body — messages array + userContext
    const { messages, userContext } = req.body as ChatRequest;

    // Get the last user message — that's what we're responding to
    const lastMessage = messages[messages.length - 1];

    // Safety check — if there are no messages somehow, bail out cleanly
    if (!lastMessage || lastMessage.role !== "user") {
      res
        .status(400)
        .json({ success: false, message: "No user message found." });
      return;
    }

    // Set SSE headers so the browser knows this is a streaming response
    res.setHeader("Content-Type", "text/event-stream"); // SSE content type
    res.setHeader("Cache-Control", "no-cache"); // Never cache SSE responses
    res.setHeader("Connection", "keep-alive"); // Keep the connection open while streaming
    res.setHeader("X-Accel-Buffering", "no"); // Tell nginx NOT to buffer this response

    // Pick the scripted response based on what the user said
    const responseText = getMockResponse(
      lastMessage.content,
      userContext.firstName,
    );

    // Stream the response word by word to simulate real OpenAI streaming
    await streamText(res, responseText);

    // Send the [done] signal so the frontend knows streaming is finished
    writeChunk(res, { done: true });

    // End the HTTP response — closes the SSE connection cleanly
    res.end();
  } catch (error) {
    // Log the real error internally for debugging
    logger.error("Mock chat controller error:", error);

    // If headers haven't been sent yet, return a normal JSON error
    if (!res.headersSent) {
      res
        .status(500)
        .json({
          success: false,
          message: "Something went wrong. Please try again.",
        });
      return;
    }

    // If streaming already started, send an error chunk then close
    res.write(
      `data: ${JSON.stringify({ error: "Something went wrong. Please try again." })}\n\n`,
    );
    res.end();
  }
};
