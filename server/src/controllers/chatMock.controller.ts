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
// Fake tool results are shaped exactly like real tool results so the pipeline is identical
const getMockResponse = (
  userMessage: string,
  firstName: string | null,
): string => {
  // Greeting / hello
  if (contains(userMessage, ["hello", "hi", "hey", "halo", "hei"])) {
    const name = firstName ? ` ${firstName}` : "";
    return `Hi${name}! I'm KUN, your Kun Bookshop assistant. I can help you find books, answer questions, or manage your cart and library. What can I do for you?`;
  }

  // Book search — fake tool result shape: { success: true, data: book[] }
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
    return `I searched for that and found a few results!\n\n📖 **Dune** by Frank Herbert — $12.99 (PDF)\nRating: 4.8 ⭐ | Category: Science Fiction\n\n📖 **The Hobbit** by J.R.R. Tolkien — $9.99 (ePub)\nRating: 4.9 ⭐ | Category: Fantasy\n\n📖 **1984** by George Orwell — $8.99 (PDF)\nRating: 4.7 ⭐ | Category: Dystopian\n\nWant more details on any of these, or should I add one to your cart?`;
  }

  // Add to cart — fake tool result: { success: true, data: { message } }
  if (
    contains(userMessage, [
      "add to cart",
      "add it",
      "tambah",
      "add dune",
      "add the",
      "add 1984",
      "add hobbit",
    ])
  ) {
    return `Done! I've added that book to your cart. 🛒\n\nWant to keep browsing, apply a coupon, or head to checkout?`;
  }

  // Already in cart — fake tool result: { success: false, alreadyInCart: true }
  if (contains(userMessage, ["already in cart"])) {
    return `That book is already in your cart! Head to checkout when you're ready, or would you like to keep browsing?`;
  }

  // View cart — fake tool result: { success: true, data: { items, coupon, itemCount } }
  if (
    contains(userMessage, [
      "my cart",
      "show cart",
      "view cart",
      "keranjang saya",
      "show my cart",
    ])
  ) {
    return `Here's your cart:\n\n🛒 **Dune** by Frank Herbert — $12.99\n\nSubtotal: $12.99 | 1 item\nNo coupon applied.\n\nWant to apply a coupon code, remove an item, or go to checkout?`;
  }

  // Library — fake tool result: { success: true, data: { books, totalOwned } }
  if (
    contains(userMessage, [
      "my library",
      "my books",
      "purchased",
      "library",
      "perpustakaan",
      "show my library",
    ])
  ) {
    return `Here are the books in your library:\n\n📚 **The Great Gatsby** by F. Scott Fitzgerald (PDF)\n📚 **To Kill a Mockingbird** by Harper Lee (ePub)\n\n2 books total. PDF books can be read right here in your browser. ePub books can be downloaded to any reader app.`;
  }

  // Orders — fake tool result: { success: true, data: { orders, totalOrders } }
  if (
    contains(userMessage, [
      "my orders",
      "order history",
      "pesanan",
      "show my orders",
    ])
  ) {
    return `Here's your recent order history:\n\n📦 **ORD-20260401-XYZ** — $12.99 — 1 book\nCompleted 3 days ago\n\n📦 **ORD-20260315-ABC** — $18.98 — 2 books\nCompleted 2 weeks ago\n\nNeed help with a specific order?`;
  }

  // Coupon — fake tool result: { success: true, data: { code, discountAmount, finalTotal } }
  if (
    contains(userMessage, [
      "coupon",
      "discount",
      "promo",
      "kode",
      "diskon",
      "voucher",
      "check coupon",
    ])
  ) {
    return `I checked that coupon for you!\n\n🎟 **WELCOME10** — 10% off\nDiscount: -$1.30\nFinal total: $11.69\n\nWant me to apply it to your cart, or is there anything else I can help with?`;
  }

  // Featured books — fake tool result: { success: true, data: book[] }
  if (
    contains(userMessage, [
      "featured",
      "recommend",
      "popular",
      "bestseller",
      "trending",
    ])
  ) {
    return `Here are some of our featured books right now:\n\n⭐ **Atomic Habits** by James Clear — $11.99 (PDF)\n⭐ **Sapiens** by Yuval Noah Harari — $13.99 (ePub)\n⭐ **The Alchemist** by Paulo Coelho — $8.99 (PDF)\n\nWant details on any of these, or shall I add one to your cart?`;
  }

  // Categories — fake tool result: { success: true, data: string[] }
  if (
    contains(userMessage, [
      "categories",
      "genres",
      "kategori",
      "what kind",
      "what type",
    ])
  ) {
    return `Here are the categories available at Kun Bookshop:\n\n📚 Fiction · Non-Fiction · Science Fiction · Fantasy · Biography · Self-Help · History · Science · Technology · Psychology\n\nWant me to search for books in a specific category?`;
  }

  // Download / format questions
  if (
    contains(userMessage, ["download", "format", "pdf", "epub", "how to read"])
  ) {
    return `Here's how it works at Kun Bookshop:\n\n📄 **PDF books** — Read directly in your browser with full progress tracking, or download for offline use. Download links are valid for 1 hour and can be regenerated anytime from your library.\n\n📱 **ePub books** — Download and open in your favourite reading app (Apple Books, Google Play Books, Kindle, etc.)\n\nAll downloads are instant after purchase — no waiting!`;
  }

  // Payment questions
  if (
    contains(userMessage, [
      "payment",
      "pay",
      "stripe",
      "bayar",
      "checkout",
      "secure",
    ])
  ) {
    return `Payments at Kun Bookshop are processed by **Stripe** — one of the world's most trusted payment platforms. We accept all major credit and debit cards. Your card details are never stored on our servers.`;
  }

  // Refund policy
  if (
    contains(userMessage, ["refund", "return", "refund policy", "pengembalian"])
  ) {
    return `Since all our books are digital products, we generally don't offer refunds after a successful download. However, if you experienced a technical issue with your purchase, reach out and we'll do our best to help!`;
  }

  // Wishlist
  if (
    contains(userMessage, [
      "wishlist",
      "wish list",
      "save for later",
      "bookmark",
      "favorit",
    ])
  ) {
    return `Done! I've added that book to your wishlist. 💛\n\nYou can find all your saved books in your account under "Wishlist". Want to keep browsing?`;
  }

  // Guest tries an action — fake tool result: { success: false, requiresAuth: true }
  if (
    contains(userMessage, ["log in", "login", "sign in", "masuk", "daftar"])
  ) {
    return `You'll need to be logged in to do that. You can log in at the top right of the page — it only takes a second! Once you're in, I can help you manage your cart, library, and orders.`;
  }

  // Off-topic redirect
  if (
    contains(userMessage, [
      "weather",
      "politics",
      "sport",
      "football",
      "cuaca",
      "berita",
      "news",
      "movie",
      "film",
    ])
  ) {
    return `Ha, I wish I could help with that! I'm KUN — I'm only set up to assist with things related to Kun Bookshop. Is there a book I can help you find, or a question about your account?`;
  }

  // Default fallback
  return `I'm not quite sure I understood that. Here's what I can do:\n\n🔍 **Find books** — just tell me what you're looking for\n🛒 **Manage your cart** — add, remove, or view items\n📚 **Check your library** — see your purchased books\n📦 **Order history** — review past purchases\n🎟 **Validate coupons** — check if a code is valid\n❓ **Answer questions** — downloads, formats, payments\n\nWhat would you like to do?`;
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
      res.status(500).json({
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
