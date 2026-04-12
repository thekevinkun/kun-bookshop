// Pull in jest-dom — adds matchers like toBeInTheDocument(), toHaveValue(), etc.
// These are not in vitest by default; this import patches them in globally
import "@testing-library/jest-dom";

// Import vi from vitest — we use it to create mocks below
import { vi, afterEach } from "vitest";

// Mock axios globally
// Our hooks and components call axios under the hood.
// We never want real HTTP requests in unit/component tests — mock the whole module.
vi.mock("axios", () => {
  // Build a fake axios instance with the methods our app uses
  const mockAxiosInstance = {
    get: vi.fn(), // used by useBooks, useAuth, etc.
    post: vi.fn(), // used by LoginForm, RegisterForm, checkout
    put: vi.fn(), // used by profile update, admin edits
    delete: vi.fn(), // used by admin delete actions
    patch: vi.fn(), // used by role updates

    // interceptors — our api.ts attaches request/response interceptors on startup.
    // We stub them as no-ops so the app doesn't crash when it calls .use()
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  };

  return {
    // default export is a callable that returns the mock instance
    default: {
      create: vi.fn(() => mockAxiosInstance), // axios.create() → our mock
      ...mockAxiosInstance, // also expose methods on the default export
    },
    // Named export so "import axios from 'axios'" and "import { get } from 'axios'" both work
    ...mockAxiosInstance,
  };
});

// Mock react-router-dom navigation hooks
// Components like LoginForm call useNavigate() to redirect after login.
// In tests there's no real router — we mock these hooks so components don't crash.
vi.mock("react-router-dom", async () => {
  // importActual pulls in everything from the real package first
  const actual = await vi.importActual("react-router-dom");

  return {
    // Spread in all real exports (Link, Route, etc. still work normally)
    ...actual,

    // Replace the navigation hooks with controllable spies
    useNavigate: vi.fn(() => vi.fn()), // returns a fake navigate() function
    useLocation: vi.fn(() => ({
      // returns a fake location object
      pathname: "/",
      search: "",
      hash: "",
      state: null,
    })),
    useParams: vi.fn(() => ({})), // returns empty params by default
  };
});

// Mock window.matchMedia
// jsdom doesn't implement matchMedia — Mantine and some Radix components call it
// on mount. Without this stub they throw and break every test.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false, // default to "does not match" for all media queries
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated but still called by some libs
    removeListener: vi.fn(), // deprecated but still called by some libs
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
// jsdom doesn't implement ResizeObserver — Mantine components use it for
// responsive sizing. Stub it out so components can mount without errors.
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
// Some lazy-load and infinite scroll patterns use IntersectionObserver.
// jsdom doesn't have it — stub it so those components don't crash.
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Clean up after every test
// Reset all mock call counts and return values between tests.
// This prevents one test's mock state from leaking into the next test.
afterEach(() => {
  vi.clearAllMocks(); // clears call history but keeps the mock in place
});
