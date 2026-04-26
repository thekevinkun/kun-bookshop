// chat.ts — TypeScript types for the KUN AI Chatbot feature
// Used by controllers, services, and routes on the backend

// A single message in the conversation history
// role: who sent it — "user" (human) or "assistant" (KUN)
// content: the actual text of the message
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Info about the current user sent from the frontend with every request
// Used to personalize KUN's greeting and gate auth-required tools
export interface UserContext {
  userId: string | null; // MongoDB _id of the user, null if guest
  firstName: string | null; // User's first name for personalized greeting
  isAuthenticated: boolean; // true = logged in, false = guest
}

// Shape of the POST /api/chat request body
// messages: the conversation history so far (last 20 max)
// userContext: who is sending the message
export interface ChatRequest {
  messages: ChatMessage[];
  userContext: UserContext;
}

// Shape of a single SSE token chunk sent from server → client
// token: one piece of the streaming response text
// done: true signals the stream is finished (replaces [DONE] string check)
export interface ChatStreamChunk {
  token?: string; // Present on normal chunks
  done?: boolean; // Present on the final chunk to signal end of stream
  error?: string; // Present if something went wrong mid-stream
}
