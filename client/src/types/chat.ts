// Frontend TypeScript types for the KUN AI Chatbot
// Mirrors the backend types but lives on the client side

// A single message in the conversation — either from the user or KUN
export interface ChatMessage {
  id: string; // Unique ID generated on the frontend for React keys
  role: "user" | "assistant"; // Who sent it
  content: string; // The actual text
  isStreaming?: boolean; // true while KUN is still typing this message
}

// Info about the current user — sent with every request to personalize KUN
export interface UserContext {
  userId: string | null; // MongoDB _id, null if guest
  firstName: string | null; // First name for greeting, null if guest
  isAuthenticated: boolean; // true = logged in, false = guest
  timePeriod: "morning" | "afternoon" | "evening" | "latenight";
}

// Shape of the body we POST to /api/chat
export interface ChatRequest {
  messages: Omit<ChatMessage, "id" | "isStreaming">[]; // Strip frontend-only fields before sending
  userContext: UserContext;
}
