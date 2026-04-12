import { test, expect } from "@playwright/test";
import { TEST_USER, loginAs } from "./helpers";

// Helper — navigates to /books, clicks the first book card, lands on detail page
// Used by multiple tests to avoid repeating the same navigation steps
const goToFirstBookDetail = async (page: Parameters<typeof loginAs>[0]) => {
  await page.goto("/books");
  const firstCard = page.getByRole("link", { name: /cover of/i }).first();
  await firstCard.waitFor({ state: "visible", timeout: 10_000 });
  await firstCard.click();
};

// Helper — adds the current book detail page's book to the cart
const addCurrentBookToCart = async (page: Parameters<typeof loginAs>[0]) => {
  const addBtn = page.getByRole("button", { name: "Add to Cart" });
  await addBtn.waitFor({ state: "visible", timeout: 10_000 });
  await addBtn.click();
};

test.describe("Browse → Cart → Checkout → Library", () => {
  // Every test in this file starts with the E2E user already logged in
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);
  });

  // Browse
  test("book catalog page loads and displays book cards", async ({ page }) => {
    await page.goto("/books");

    // BookCard renders as a <Link> whose accessible name includes "Cover of"
    // from the alt text of the cover image inside it
    await expect(
      page.getByRole("link", { name: /cover of/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("clicking a book card navigates to the book detail page", async ({
    page,
  }) => {
    await page.goto("/books");

    const firstCard = page.getByRole("link", { name: /cover of/i }).first();
    await firstCard.waitFor({ state: "visible", timeout: 10_000 });

    // Capture the href before clicking so we can assert the URL after navigation
    const href = await firstCard.getAttribute("href");
    await firstCard.click();

    // Should land on /books/:id
    await expect(page).toHaveURL(new RegExp(href!));

    // Add to Cart lives in BookDetailHero — confirms the detail page loaded
    await expect(page.getByRole("button", { name: "Add to Cart" })).toBeVisible(
      { timeout: 10_000 },
    );
  });

  // Cart
  test("user can add a book to the cart from the book detail page", async ({
    page,
  }) => {
    await goToFirstBookDetail(page);
    await addCurrentBookToCart(page);

    // Button flashes "✓ Added!" for 1.5s then becomes "View in Cart"
    await expect(
      page.getByRole("button", { name: /added|view in cart/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("cart drawer opens and shows the added book", async ({ page }) => {
    await goToFirstBookDetail(page);
    await addCurrentBookToCart(page);

    // Open the cart drawer using the navbar cart icon button
    await page.getByRole("button", { name: "Open cart" }).click();

    // Radix Dialog.Content mounts when the drawer opens
    await expect(page.getByRole("dialog")).toBeVisible();

    // At least one book should appear as a list item inside the drawer
    await expect(page.locator("[role='dialog'] li").first()).toBeVisible();
  });

  test("user can remove a book from the cart drawer", async ({ page }) => {
    await goToFirstBookDetail(page);
    await addCurrentBookToCart(page);

    await page.getByRole("button", { name: "Open cart" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Each item has aria-label="Remove {title} from cart" on its trash button
    await page
      .getByRole("button", { name: /remove .+ from/i })
      .first()
      .click();

    // Empty state message appears after the last item is removed
    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
  });

  // Checkout
  test("clicking Checkout redirects to Stripe hosted checkout page", async ({
    page,
  }) => {
    await goToFirstBookDetail(page);
    await addCurrentBookToCart(page);

    await page.getByRole("button", { name: "Open cart" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // POST /api/checkout/create-session → Stripe session URL → redirect
    await Promise.all([
      page.waitForURL(/checkout\.stripe\.com/, { timeout: 15_000 }),
      page.getByRole("button", { name: "Checkout" }).click(),
    ]);

    // Our app's job is to create the session and redirect correctly
    // What happens on Stripe's page is Stripe's responsibility
    expect(page.url()).toContain("checkout.stripe.com");
  });

  // Library
  test("purchased book appears in the user library", async ({ page }) => {
    await page.goto("/library");

    // Library card renders <img alt="Cover of {title}">
    // The e2e user must have at least one book in their library
    // Run: cd server && npm run seed:users — to ensure this
    await expect(
      page.getByRole("img", { name: /^cover of/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("library shows a download button for each purchased book", async ({
    page,
  }) => {
    await page.goto("/library");

    // Each library card has a button with text "Download"
    await expect(
      page.getByRole("button", { name: "Download" }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("unauthenticated user cannot access the library", async ({ page }) => {
    // Clear localStorage to simulate a logged-out user
    await page.evaluate(() => localStorage.clear());
    await page.goto("/library");

    // ProtectedRoute redirects unauthenticated users to /login
    await expect(page).toHaveURL(/.*login/);
  });
});
