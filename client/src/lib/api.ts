// Import axios to make HTTP requests to our backend
import axios from "axios";

// Import our auth store so the interceptor can read and update tokens
import { useAuthStore } from "../store/auth";

import { useCartStore } from "../store/cart";

// SHARED REFRESH LOCK
// A single promise that represents an in-flight refresh request.
// Both initAuth and the response interceptor check this before firing their own refresh.
// This prevents two simultaneous refresh calls from revoking each other's tokens.
let refreshPromise: Promise<string> | null = null;

// Call this anywhere a refresh is needed — it deduplicates concurrent callers.
// If a refresh is already running, returns the same promise instead of starting a new one.
export const performRefresh = (): Promise<string> => {
  if (refreshPromise) return refreshPromise; // Already in flight — reuse it

  refreshPromise = api
    .post("/auth/refresh")
    .then((res) => {
      const newToken = res.data.token;
      useAuthStore.getState().setToken(newToken); // Save to store
      return newToken;
    })
    .finally(() => {
      refreshPromise = null; // Clear the lock when done, success or failure
    });

  return refreshPromise;
};

// CREATE AXIOS INSTANCE
// Instead of using axios directly, we create a configured instance
// This way every request automatically gets our base URL and credentials setting
const api = axios.create({
  // All requests will be prefixed with this URL — matches our backend PORT from .env
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",

  // withCredentials: true is CRITICAL — this tells the browser to send httpOnly cookies
  // Without this, the browser strips the auth cookies from every request
  withCredentials: true,

  headers: {
    "Content-Type": "application/json", // Tell the server we're sending JSON
  },
});

// REQUEST INTERCEPTOR
// Runs before every request is sent
// We use it to attach the access token from our Zustand store to the Authorization header
// This covers API clients and cases where cookies might not be available
api.interceptors.request.use(
  (config) => {
    // Read the current token directly from the store state (not the hook — this is outside React)
    const token = useAuthStore.getState().token;

    // If we have a token, attach it as a Bearer token in the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config; // Return the modified config — the request proceeds
  },
  (error) => {
    // If something goes wrong building the request, reject the promise
    return Promise.reject(error);
  },
);

// RESPONSE INTERCEPTOR
// Runs after every response comes back from the server
// We use it to automatically handle 401 errors by attempting a token refresh
// This means the user never sees a "session expired" error — it happens silently
let isRefreshing = false;
// Queue of requests that came in while a refresh was already in progress
// We hold them here and replay them after the new token arrives
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

// Helper to process the queue after a refresh attempt
// If refresh succeeded, replay all queued requests with the new token
// If refresh failed, reject all queued requests so they show errors
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error); // Refresh failed — tell each waiting request to give up
    } else {
      prom.resolve(token!); // Refresh succeeded — give each request the new token
    }
  });
  failedQueue = []; // Clear the queue after processing
};

api.interceptors.response.use(
  // If the response is successful (2xx), just pass it through untouched
  (response) => response,

  // If the response is an error, check if it's a 401 and try to refresh
  async (error) => {
    // originalRequest: the request that just failed with a 401
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url ?? "";
    const isAuthLoginRequest = requestUrl.includes("/auth/login");

    // Only attempt refresh if:
    // 1. The error is 401 Unauthorized
    // 2. The failing request wasn't the refresh endpoint itself (prevent infinite loop)
    // 3. The failing request wasn't the login endpoint — bad credentials are not an expired session
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !requestUrl.includes("/auth/refresh") &&
      !isAuthLoginRequest
    ) {
      // If a refresh is already in progress, queue this request and wait
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            // Once we get the new token, update the header and replay the request
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Mark this request so we don't retry it again if refresh also fails
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use the shared refresh lock — if initAuth already fired a refresh,
        // this reuses that same promise instead of sending a second request
        const newToken = await performRefresh();

        // Update the Authorization header on the original failed request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Let all queued requests know we have a new token
        processQueue(null, newToken);

        // Replay the original request that triggered the 401
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — the session is truly expired
        processQueue(refreshError, null);

        useAuthStore.getState().logout();
        useCartStore.getState().loadCart();
        window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For any other error (400, 403, 404, 500 etc.), just reject normally
    return Promise.reject(error);
  },
);

// Export the configured instance — import this everywhere instead of plain axios
export default api;
