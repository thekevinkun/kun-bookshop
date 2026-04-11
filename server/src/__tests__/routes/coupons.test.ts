import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import app from "../../app";
import { connectTestDB, disconnectTestDB, clearDatabase } from "../helpers/db";
import {
  createUser,
  createAdmin,
  createCoupon,
  createOrder,
  createBook,
} from "../helpers/factories";

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearDatabase();
});

// VALIDATE COUPON
describe("POST /api/coupons/validate", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app)
      .post("/api/coupons/validate")
      .send({ code: "TESTCODE", cartTotal: 50 });

    expect(res.status).toBe(401);
  });

  it("should return discount info for a valid coupon", async () => {
    const { token } = await createUser();
    const coupon = await createCoupon({
      code: "SAVE10",
      discountType: "percentage",
      discountValue: 10,
      minPurchase: 0,
    });

    const res = await request(app)
      .post("/api/coupons/validate")
      .set("Cookie", `token=${token}`)
      .send({ code: coupon.code, cartTotal: 100 });

    expect(res.status).toBe(200);
    expect(res.body.discountAmount).toBe(10); // 10% of 100
    expect(res.body.finalTotal).toBe(90);
  });

  // Non-existent coupon — your controller returns 404, not 400
  it("should return 404 for a non-existent coupon code", async () => {
    const { token } = await createUser();

    const res = await request(app)
      .post("/api/coupons/validate")
      .set("Cookie", `token=${token}`)
      .send({ code: "DOESNOTEXIST", cartTotal: 50 });

    // Your validateCoupon returns 404 when the coupon code doesn't exist in the DB
    expect(res.status).toBe(404);
  });

  it("should return 400 for an inactive coupon", async () => {
    const { token } = await createUser();
    const coupon = await createCoupon({ isActive: false });

    const res = await request(app)
      .post("/api/coupons/validate")
      .set("Cookie", `token=${token}`)
      .send({ code: coupon.code, cartTotal: 50 });

    expect(res.status).toBe(400);
  });

  it("should return 400 for an expired coupon", async () => {
    const { token } = await createUser();
    const coupon = await createCoupon({
      // validUntil in the past — coupon has expired
      validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    const res = await request(app)
      .post("/api/coupons/validate")
      .set("Cookie", `token=${token}`)
      .send({ code: coupon.code, cartTotal: 50 });

    expect(res.status).toBe(400);
  });

  it("should return 400 when coupon has not started yet", async () => {
    const { token } = await createUser();
    const coupon = await createCoupon({
      // validFrom is in the future — coupon not yet active
      validFrom: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const res = await request(app)
      .post("/api/coupons/validate")
      .set("Cookie", `token=${token}`)
      .send({ code: coupon.code, cartTotal: 50 });

    expect(res.status).toBe(400);
  });

  it("should return 400 when usage limit is reached", async () => {
    const { token } = await createUser();
    const coupon = await createCoupon({
      usageLimit: 5,
      usedCount: 5, // Already used 5 out of 5 — at the limit
    });

    const res = await request(app)
      .post("/api/coupons/validate")
      .set("Cookie", `token=${token}`)
      .send({ code: coupon.code, cartTotal: 50 });

    expect(res.status).toBe(400);
  });

  it("should return 400 when cart total is below minPurchase", async () => {
    const { token } = await createUser();
    const coupon = await createCoupon({
      minPurchase: 100, // Requires at least $100 cart
    });

    const res = await request(app)
      .post("/api/coupons/validate")
      .set("Cookie", `token=${token}`)
      .send({ code: coupon.code, cartTotal: 30 }); // Only $30 — below minimum

    expect(res.status).toBe(400);
  });

  it("should return 400 when user has already used the coupon", async () => {
    const { user, token } = await createUser();
    const book = await createBook();
    const coupon = await createCoupon({ code: "USEDONCE" });

    // Create a completed order that used this coupon — simulates prior use
    await createOrder(user._id.toString(), book._id.toString(), {
      couponCode: coupon.code,
      paymentStatus: "completed",
    });

    const res = await request(app)
      .post("/api/coupons/validate")
      .set("Cookie", `token=${token}`)
      .send({ code: coupon.code, cartTotal: 50 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already used/i);
  });

  it("should correctly cap percentage discount at maxDiscount", async () => {
    const { token } = await createUser();
    const coupon = await createCoupon({
      discountType: "percentage",
      discountValue: 50, // 50% off
      maxDiscount: 20, // But never more than $20 off
    });

    const res = await request(app)
      .post("/api/coupons/validate")
      .set("Cookie", `token=${token}`)
      .send({ code: coupon.code, cartTotal: 200 }); // 50% of 200 = 100, capped at 20

    expect(res.status).toBe(200);
    expect(res.body.discountAmount).toBe(20); // Capped at maxDiscount
    expect(res.body.finalTotal).toBe(180);
  });

  it("should correctly apply a fixed discount", async () => {
    const { token } = await createUser();
    const coupon = await createCoupon({
      discountType: "fixed",
      discountValue: 15, // $15 off flat
    });

    const res = await request(app)
      .post("/api/coupons/validate")
      .set("Cookie", `token=${token}`)
      .send({ code: coupon.code, cartTotal: 50 });

    expect(res.status).toBe(200);
    expect(res.body.discountAmount).toBe(15);
    expect(res.body.finalTotal).toBe(35);
  });
});

// ADMIN — GET COUPONS
describe("GET /api/admin/coupons", () => {
  it("should return 401 when not authenticated", async () => {
    const res = await request(app).get("/api/admin/coupons");
    expect(res.status).toBe(401);
  });

  it("should return 403 when authenticated as regular user", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .get("/api/admin/coupons")
      .set("Cookie", `token=${token}`);
    expect(res.status).toBe(403);
  });

  it("should return all coupons for admin", async () => {
    const { token } = await createAdmin();
    await createCoupon({ code: "COUPON1" });
    await createCoupon({ code: "COUPON2" });

    const res = await request(app)
      .get("/api/admin/coupons")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.coupons).toHaveLength(2);
  });
});

// ADMIN — CREATE COUPON
describe("POST /api/admin/coupons", () => {
  it("should create a coupon when called by admin", async () => {
    const { token } = await createAdmin();

    const res = await request(app)
      .post("/api/admin/coupons")
      .set("Cookie", `token=${token}`)
      .send({
        code: "NEWCOUPON",
        discountType: "percentage",
        discountValue: 20,
        minPurchase: 0,
        validFrom: new Date().toISOString(),
        validUntil: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        usageLimit: 50,
      });

    expect(res.status).toBe(201);
    expect(res.body.coupon.code).toBe("NEWCOUPON");
  });

  // Duplicate coupon code — your controller returns 409 Conflict, not 400
  it("should return 409 for duplicate coupon code", async () => {
    const { token } = await createAdmin();
    await createCoupon({ code: "DUPLICATE" });

    const res = await request(app)
      .post("/api/admin/coupons")
      .set("Cookie", `token=${token}`)
      .send({
        code: "DUPLICATE",
        discountType: "fixed",
        discountValue: 10,
        minPurchase: 0,
        validFrom: new Date().toISOString(),
        validUntil: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        usageLimit: 10,
      });

    // 409 Conflict — same as duplicate email in register
    expect(res.status).toBe(409);
  });
});

// ADMIN — UPDATE COUPON
describe("PATCH /api/admin/coupons/:id", () => {
  it("should update a coupon when called by admin", async () => {
    const { token } = await createAdmin();
    const coupon = await createCoupon({ isActive: true });

    const res = await request(app)
      .patch(`/api/admin/coupons/${coupon._id}`)
      .set("Cookie", `token=${token}`)
      .send({ isActive: false }); // Deactivate it

    expect(res.status).toBe(200);
    expect(res.body.coupon.isActive).toBe(false);
  });
});

// ADMIN — DELETE COUPON
describe("DELETE /api/admin/coupons/:id", () => {
  it("should delete a coupon when called by admin", async () => {
    const { token } = await createAdmin();
    const coupon = await createCoupon();

    const res = await request(app)
      .delete(`/api/admin/coupons/${coupon._id}`)
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);

    // Verify it's actually gone from the database
    const { Coupon } = await import("../../models/Coupon");
    const deleted = await Coupon.findById(coupon._id);
    expect(deleted).toBeNull();
  });

  it("should return 403 when called by regular user", async () => {
    const { token } = await createUser();
    const coupon = await createCoupon();

    const res = await request(app)
      .delete(`/api/admin/coupons/${coupon._id}`)
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(403);
  });
});
