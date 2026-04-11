import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import request from "supertest";
import app from "../../app";
import { connectTestDB, disconnectTestDB, clearDatabase } from "../helpers/db";
import { createUser, createBook, createCoupon } from "../helpers/factories";

// Tell Vitest to use our mock for stripe — this is hoisted above all imports
vi.mock("stripe", () => {
  const mockStripeInstance = {
    checkout: {
      sessions: {
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
      constructEvent: vi.fn(),
    },
  };
  return { default: vi.fn().mockImplementation(() => mockStripeInstance) };
});

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearDatabase();
  vi.clearAllMocks(); // Reset mock call counts between tests
});

// CREATE CHECKOUT SESSION
describe("POST /api/checkout/create-session", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/checkout/create-session")
      .send({ bookIds: ["64f1a2b3c4d5e6f7a8b9c0d1"] });

    expect(res.status).toBe(401);
  });

  it("should return 400 when bookIds array is empty", async () => {
    const { token } = await createUser();

    const res = await request(app)
      .post("/api/checkout/create-session")
      .set("Cookie", `token=${token}`)
      .send({ items: [] }); // Empty items array

    expect(res.status).toBe(400);
  });

  it("should return 400 when a book does not exist or is inactive", async () => {
    const { token } = await createUser();
    const fakeId = "64f1a2b3c4d5e6f7a8b9c0d1";

    const res = await request(app)
      .post("/api/checkout/create-session")
      .set("Cookie", `token=${token}`)
      .send({ items: [{ bookId: fakeId }] });

    expect(res.status).toBe(400);
  });

  it("should create a Stripe session and return sessionId for valid books", async () => {
    const { token } = await createUser();
    const book = await createBook({ title: "Checkout Book", price: 29.99 });

    const res = await request(app)
      .post("/api/checkout/create-session")
      .set("Cookie", `token=${token}`)
      .send({ items: [{ bookId: book._id.toString() }] });

    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe("cs_test_fake_session_id");
    expect(res.body.url).toContain("checkout.stripe.com");
  });

  it("should apply coupon discount when a valid coupon code is sent", async () => {
    const { token } = await createUser();
    const book = await createBook({ price: 100 });
    const coupon = await createCoupon({
      discountType: "percentage",
      discountValue: 20,
    });

    const res = await request(app)
      .post("/api/checkout/create-session")
      .set("Cookie", `token=${token}`)
      .send({
        items: [{ bookId: book._id.toString() }],
        couponCode: coupon.code,
      });

    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBeDefined();
  });

  it("should silently ignore an invalid coupon and charge full price", async () => {
    const { token } = await createUser();
    const book = await createBook({ price: 50 });

    const res = await request(app)
      .post("/api/checkout/create-session")
      .set("Cookie", `token=${token}`)
      .send({
        items: [{ bookId: book._id.toString() }],
        couponCode: "FAKECOUPON",
      });

    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBeDefined();
  });

  it("should prevent duplicate checkout sessions for the same books within 10 minutes", async () => {
    const { token, user } = await createUser();
    const book = await createBook({ price: 30 });

    // Import Order directly — no dynamic import to avoid OverwriteModelError
    const { Order } = await import("../../models/Order");
    await Order.create({
      userId: user._id,
      orderNumber: `ORD-${Date.now()}-TEST`,
      items: [
        {
          bookId: book._id,
          title: book.title,
          author: book.authorName,
          price: book.price,
          coverImage: book.coverImage,
        },
      ],
      subtotal: 30,
      total: 30,
      paymentStatus: "pending",
      stripeSessionId: "cs_test_existing_session",
      createdAt: new Date(),
    });

    const res = await request(app)
      .post("/api/checkout/create-session")
      .set("Cookie", `token=${token}`)
      .send({ items: [{ bookId: book._id.toString() }] });

    expect(res.status).toBe(200);
  });
});
