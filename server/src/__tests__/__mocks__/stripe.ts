// This mock replaces the real Stripe SDK for ALL test files automatically
// Vitest picks up files in __mocks__ that sit alongside node_modules usage
import { vi } from "vitest";

// Build the fake Stripe instance — same shape as the real one our controllers use
const mockStripeInstance = {
  checkout: {
    sessions: {
      // Returns a predictable fake session so no real Stripe API call is ever made
      create: vi.fn().mockResolvedValue({
        id: "cs_test_fake_session_id",
        url: "https://checkout.stripe.com/pay/cs_test_fake",
      }),
      retrieve: vi.fn().mockResolvedValue({
        id: "cs_test_existing_session",
        url: "https://checkout.stripe.com/pay/cs_test_existing",
      }),
    },
  },
  webhooks: {
    // constructEvent is called by the webhook controller to verify Stripe signatures
    constructEvent: vi.fn(),
  },
};

// Export a constructor function — mirrors how the real Stripe SDK works
// Your controller does: const stripe = new Stripe(key)
const StripeMock = vi.fn(() => mockStripeInstance);

export default StripeMock;
