// Core hook for the KUN AI Chatbot
// Manages message state, handles SSE streaming, calls /api/chat
// Used by ChatPanel on both the floating widget and /contact page

import { useState, useCallback } from "react";

// Zustand auth store — get user info
import { useAuthStore } from "../store/auth";

// Our chat types
import type { ChatMessage, UserContext } from "../types/chat";

// Generate a simple unique ID for each message
// Used as the React key and to identify which message is streaming
const generateId = () =>
  `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// The base URL for all API calls — set in .env as VITE_API_URL
const API_URL = import.meta.env.VITE_API_URL as string;

export const useChat = () => {
  // messages — the full conversation history shown in the UI
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // isLoading — true while waiting for the first token from the server
  // Used to show the "KUN is typing..." indicator
  const [isLoading, setIsLoading] = useState(false);

  // error — holds an error string if the request fails entirely
  const [error, setError] = useState<string | null>(null);

  // Pull auth state from Zustand — we need this to build userContext
  const { user, isAuthenticated } = useAuthStore();

  // sendMessage
  // Main function — called when user submits a message
  // Appends user message, calls the backend, streams KUN's response in
  const sendMessage = useCallback(
    async (content: string) => {
      // Trim and ignore empty submissions
      if (!content.trim()) return;

      // Clear any previous error
      setError(null);

      // Build the user's message object
      const userMessage: ChatMessage = {
        id: generateId(), // Unique ID for React key
        role: "user", // Sent by the human
        content: content.trim(), // Trimmed text
      };

      // Append the user message to the conversation immediately
      // so the UI feels instant — don't wait for the server
      setMessages((prev) => [...prev, userMessage]);

      // Show the typing indicator while waiting for the first token
      setIsLoading(true);

      // Build a placeholder message for KUN — starts empty, fills as tokens arrive
      const assistantMessageId = generateId(); // ID we'll use to update this specific message
      const assistantPlaceholder: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "", // Empty for now — will fill token by token
        isStreaming: true, // Tells ChatMessage component to show cursor
      };

      // Add the empty placeholder so the UI shows KUN's bubble immediately
      setMessages((prev) => [...prev, assistantPlaceholder]);

      try {
        // Build the userContext from Zustand auth state
        const userContext: UserContext = {
          userId: user?.id ?? null, // MongoDB _id or null for guests
          firstName: user?.firstName ?? null, // First name for personalized greeting
          isAuthenticated, // Whether user is logged in
        };
        console.log("user context: ", userContext);
        // Build the messages array to send — strip frontend-only fields (id, isStreaming)
        // Only send the last 20 messages to stay within context limits
        const historyToSend = [...messages, userMessage]
          .slice(-20) // Keep only the last 20 messages
          .map(({ role, content }) => ({ role, content })); // Strip id + isStreaming

        // Call POST /api/chat — use fetch (not axios) because we need the raw ReadableStream
        // axios doesn't support streaming SSE responses
        const response = await fetch(`${API_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // Tell the server we're sending JSON
          },
          credentials: "include", // Send cookies so the server can check auth
          body: JSON.stringify({
            messages: historyToSend,
            userContext,
          }),
        });

        // If the server returned a non-2xx status, extract and throw the error message
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message ?? "Something went wrong.");
        }

        // Get the readable stream from the response body
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream available.");

        // TextDecoder converts raw bytes from the stream into readable strings
        const decoder = new TextDecoder();

        // Hide the typing indicator — first token is about to arrive
        setIsLoading(false);

        // Stream reading loop
        // Read chunks from the SSE stream until the server signals [done]
        while (true) {
          const { done, value } = await reader.read(); // Read the next chunk

          // done = true means the stream has closed (connection ended)
          if (done) break;

          // Decode the raw bytes into a string (may contain multiple SSE events)
          const text = decoder.decode(value, { stream: true });

          // SSE events are separated by "\n\n" — split and process each one
          const lines = text.split("\n\n");

          for (const line of lines) {
            // SSE events start with "data: " — skip anything that doesn't
            if (!line.startsWith("data: ")) continue;

            // Strip the "data: " prefix to get the raw JSON string
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue; // Skip empty lines

            try {
              const chunk = JSON.parse(jsonStr); // Parse the JSON chunk

              // If the server signals done, mark streaming as finished
              if (chunk.done) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, isStreaming: false } // Remove the streaming cursor
                      : msg,
                  ),
                );
                break; // Exit the line-processing loop
              }

              // If there's an error chunk, throw it so the catch block handles it
              if (chunk.error) {
                throw new Error(chunk.error);
              }

              // If there's a token, append it to KUN's message content
              if (chunk.token) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + chunk.token } // Append the new token
                      : msg,
                  ),
                );
              }
            } catch {
              // Malformed JSON chunk — skip it silently (common at stream boundaries)
              continue;
            }
          }
        }
      } catch (err) {
        // Something failed — hide loading, show error, clean up the placeholder
        setIsLoading(false);

        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setError(message);

        // Replace the empty placeholder with an error message from KUN
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    "I'm having trouble right now. Please try again in a moment.",
                  isStreaming: false, // Stop the streaming cursor
                }
              : msg,
          ),
        );
      }
    },
    [messages, user, isAuthenticated],
  );

  // clearMessages — resets the conversation (called when widget closes/reopens)
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    messages, // The full conversation array
    isLoading, // true = waiting for first token (show typing indicator)
    error, // Error string or null
    sendMessage, // Call this to send a user message
    clearMessages, // Call this to reset the conversation
    isAuthenticated, // Whether the user is logged in (for personalized greeting)
  };
};
