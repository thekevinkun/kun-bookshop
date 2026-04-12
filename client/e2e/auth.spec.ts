import { test, expect } from "@playwright/test";
import { TEST_USER, loginAs } from "./helpers";

const uniqueEmail = () => `e2e_${Date.now()}@example.com`;

test.describe("Authentication", () => {
  // Registration
  test("user can register a new account and is redirected to login", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.getByLabel(/first name/i).fill("E2E");
    await page.getByLabel(/last name/i).fill("Tester");
    await page.getByLabel(/email address/i).fill(uniqueEmail());
    await page.getByLabel(/^password$/i).fill("E2ePassword123!");
    await page.getByLabel(/confirm password/i).fill("E2ePassword123!");

    await Promise.all([
      page.waitForURL("**/login"),
      page.getByRole("button", { name: /create account/i }).click(),
    ]);

    await expect(page.getByText(/check your email|verify/i)).toBeVisible();
  });

  test("registration shows an error when passwords do not match", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.getByLabel(/first name/i).fill("E2E");
    await page.getByLabel(/last name/i).fill("Tester");
    await page.getByLabel(/email address/i).fill(uniqueEmail());
    await page.getByLabel(/^password$/i).fill("E2ePassword123!");
    await page.getByLabel(/confirm password/i).fill("DifferentPassword!");

    await page.getByRole("button", { name: /create account/i }).click();

    await expect(
      page.getByText(/passwords? do not match|must match/i),
    ).toBeVisible();
    await expect(page).toHaveURL(/.*register/);
  });

  test("registration shows an error for a duplicate email", async ({
    page,
  }) => {
    await page.goto("/register");

    await page.getByLabel(/first name/i).fill("Duplicate");
    await page.getByLabel(/last name/i).fill("User");
    await page.getByLabel(/email address/i).fill(TEST_USER.email);
    await page.getByLabel(/^password$/i).fill("E2ePassword123!");
    await page.getByLabel(/confirm password/i).fill("E2ePassword123!");

    await page.getByRole("button", { name: /create account/i }).click();

    await expect(
      page.getByText(/email.*already|already.*registered/i),
    ).toBeVisible();
  });

  // Login
  test("user can log in with valid credentials and is redirected to home", async ({
    page,
  }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);
    await expect(page).toHaveURL("/");
  });

  test("login shows an error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/email address/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(
      page.getByText(/invalid credentials|incorrect/i),
    ).toBeVisible();
    await expect(page).toHaveURL(/.*login/);
  });

  test("login shows a validation error when email is empty", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: /sign in/i }).click();

    // Target the error <p> directly — avoids strict mode violation from matching the label too
    await expect(page.locator("p.text-error").first()).toBeVisible();
  });

  // Logout
  test("authenticated user can log out and is returned to the home page", async ({
    page,
  }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    // Exact selectors from Playwright codegen
    await page.getByRole("button", { name: "Open account menu" }).click();
    await page.getByRole("menuitem", { name: "Log out" }).click();

    // After logout the app redirects to /login
    await expect(page).toHaveURL(/.*login|\/$/);

    // On /login, the Sign in button confirms auth state was cleared
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  // Protected routes
  test("visiting /library while unauthenticated redirects to login", async ({
    page,
  }) => {
    await page.goto("/library");
    await expect(page).toHaveURL(/.*login/);
  });
});
