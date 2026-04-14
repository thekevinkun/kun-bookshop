import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import "./styles/globals.css";
import App from "./App.tsx";
import { queryClient } from "./lib/react-query";
import { useAuthStore } from "./store/auth";
import api from "./lib/api";

// Check if the stored token is expired before the app renders.
// If it is, attempt a silent refresh using the httpOnly refresh token cookie.
// This covers the case where authenticateOptional silently ignores expired tokens
// instead of returning 401 — meaning the response interceptor never fires.
const initAuth = async () => {
  const { token, logout, setToken } = useAuthStore.getState();

  if (token) {
    // Decode the payload — we just need the exp field, no need to verify signature here
    // atob decodes the base64 middle part of the JWT
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const isExpired = payload.exp * 1000 < Date.now();

      if (isExpired) {
        // Token is expired — try a silent refresh before the app mounts
        try {
          const res = await api.post("/auth/refresh");
          setToken(res.data.token); // Store the new token so all queries use it
        } catch {
          // Refresh token is also expired or invalid — log the user out cleanly
          logout();
        }
      }
    } catch {
      // Token is malformed — clear it
      logout();
    }
  }

  // Mark hydration complete regardless of outcome so queries are unblocked
  useAuthStore.setState({ isHydrated: true });
};

// Run auth init first, then render — this ensures the first query
// from useRecommendations always fires with a valid token
initAuth().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
});
