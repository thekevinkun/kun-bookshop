import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: "./src/__tests__/setup.ts",
    // setupFiles runs in every test file's environment — perfect for global mocks
    setupFiles: ["./src/__tests__/setupMocks.ts"],
    testTimeout: 30000,
    include: ["src/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/__tests__/**", "src/types/**", "src/server.ts"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },
  },
});
