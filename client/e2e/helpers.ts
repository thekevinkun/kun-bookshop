// Shared helpers used across all E2E test files
// Centralising these keeps the test files clean and avoids repetition
import { type Page } from "@playwright/test";

// Test credentials — these must exist in your dev database
// Run your seed script before the E2E suite to ensure they are present
export const TEST_USER = {
  email: "e2e@example.com",
  password: "E2ePassword123!",
  firstName: "E2E",
  lastName: "Tester",
};

// Fills in and submits the login form then waits for the redirect to complete
// Call this at the start of any test that requires an authenticated user
export const loginAs = async (
  page: Page,
  email: string,
  password: string,
): Promise<void> => {
  await page.goto("/login");

  // Fill email and password using their label associations (htmlFor)
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  // Click the sign-in button and wait for navigation to complete
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/login")),
    page.getByRole("button", { name: /sign in/i }).click(),
  ]);
};
