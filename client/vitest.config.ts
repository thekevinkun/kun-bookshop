// Import the defineConfig helper from vitest — gives us full TypeScript autocomplete
import { defineConfig } from "vitest/config";
// Import the React plugin so vitest can understand JSX/TSX files
import react from "@vitejs/plugin-react";
// Import path — lets us set up the same "@/" alias we use in the app
import path from "path";

export default defineConfig({
  // Register the React plugin so JSX transforms work during tests
  plugins: [react()],

  test: {
    // Use jsdom as the browser-like environment so React can render components
    environment: "jsdom",

    // This file runs before every test file — sets up jest-dom matchers and global mocks
    setupFiles: ["./src/__tests__/setup.ts"],

    // Make vi, describe, it, expect available in every file without importing them
    globals: true,

    // Coverage configuration — tells vitest how to measure and enforce coverage
    coverage: {
      // Use v8 (built into Node.js) as the coverage engine — no extra deps needed
      provider: "v8",

      // Which files to measure — all src files except tests, types, and entry point
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/__tests__/**", // test files themselves
        "src/types/**", // type-only files have nothing to test
        "src/main.tsx", // Vite entry point — not business logic
        "src/vite-env.d.ts", // ambient type declaration only
      ],

      // These thresholds mirror the backend — build fails if coverage drops below
      thresholds: {
        lines: 70, // at least 70% of lines must be executed by tests
        functions: 70, // at least 70% of functions must be called
        branches: 65, // at least 65% of if/else branches must be hit
        statements: 70, // at least 70% of statements must run
      },

      // Output both terminal summary and an html report you can open in a browser
      reporter: ["text", "html"],
    },
  },

  resolve: {
    alias: {
      // Map "@/" to the src folder — keeps imports clean, matches the app's tsconfig
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
