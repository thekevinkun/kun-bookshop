// This file runs before every single test file
// Mocking Stripe here means no test file ever accidentally hits the real Stripe API
import { vi } from "vitest";

vi.mock("stripe", () => {
  // Build the fake Stripe instance with all methods our controllers call
  const mockStripeInstance = {
    checkout: {
      sessions: {
        // Fake session creation — returns a predictable object, no real API call
        create: vi.fn().mockResolvedValue({
          id: "cs_test_fake_session_id",
          url: "https://checkout.stripe.com/pay/cs_test_fake",
        }),
        // Fake session retrieval — used by the duplicate order prevention check
        retrieve: vi.fn().mockResolvedValue({
          id: "cs_test_existing_session",
          url: "https://checkout.stripe.com/pay/cs_test_existing",
        }),
      },
    },
    webhooks: {
      // Fake webhook signature verification — used by webhook.controller.ts
      constructEvent: vi.fn(),
    },
  };

  // The Stripe SDK exports a class — mock it as a constructor returning our fake instance
  return { default: vi.fn(() => mockStripeInstance) };
});
