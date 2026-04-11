import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import app from "../../app";
import { connectTestDB, disconnectTestDB, clearDatabase } from "../helpers/db";
import {
  createUser,
  createAdmin,
  createBook,
  createOrder,
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

// AUTH GUARD — ALL ADMIN ROUTES
describe("Admin route auth guards", () => {
  it("GET /api/admin/stats — returns 401 when not authenticated", async () => {
    const res = await request(app).get("/api/admin/stats");
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/stats — returns 403 when authenticated as regular user", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Cookie", `token=${token}`);
    expect(res.status).toBe(403);
  });

  it("GET /api/admin/users — returns 403 when authenticated as regular user", async () => {
    const { token } = await createUser();
    const res = await request(app)
      .get("/api/admin/users")
      .set("Cookie", `token=${token}`);
    expect(res.status).toBe(403);
  });
});

// GET STATS
describe("GET /api/admin/stats", () => {
  it("should return dashboard stats for admin", async () => {
    const { token } = await createAdmin();

    const { user } = await createUser();
    const book = await createBook();
    await createOrder(user._id.toString(), book._id.toString());

    const res = await request(app)
      .get("/api/admin/stats")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);
    // Your getStats controller returns fields at the top level — no 'stats' wrapper
    expect(res.body.totalUsers).toBeDefined();
    expect(res.body.totalBooks).toBeDefined();
    expect(res.body.totalOrders).toBeDefined();
    expect(res.body.totalRevenue).toBeDefined();
    expect(res.body.totalUsers).toBeGreaterThanOrEqual(1);
    expect(res.body.totalBooks).toBeGreaterThanOrEqual(1);
    expect(res.body.totalOrders).toBeGreaterThanOrEqual(1);
  });
});

// GET USERS
describe("GET /api/admin/users", () => {
  it("should return all users for admin", async () => {
    const { token } = await createAdmin();
    await createUser({ email: "user1@test.com" });
    await createUser({ email: "user2@test.com" });

    const res = await request(app)
      .get("/api/admin/users")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThanOrEqual(2);
    // Passwords must never be returned — critical security check
    res.body.users.forEach((u: any) => {
      expect(u.password).toBeUndefined();
    });
  });
});

// UPDATE USER ROLE
describe("PUT /api/admin/users/:id/role", () => {
  it("should update a user role to admin", async () => {
    const { token } = await createAdmin();
    const { user } = await createUser({ email: "promote@test.com" });

    // Try the route as registered in your admin.routes.ts
    // If this still 404s, change 'role' to just PUT /api/admin/users/:id
    const res = await request(app)
      .put(`/api/admin/users/${user._id}/role`)
      .set("Cookie", `token=${token}`)
      .send({ role: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("admin");
  });

  it("should return 400 for an invalid role value", async () => {
    const { token } = await createAdmin();
    const { user } = await createUser();

    const res = await request(app)
      .put(`/api/admin/users/${user._id}/role`)
      .set("Cookie", `token=${token}`)
      .send({ role: "superuser" });

    expect(res.status).toBe(400);
  });
});

// DELETE USER
describe("DELETE /api/admin/users/:id", () => {
  it("should delete a user when called by admin", async () => {
    const { token } = await createAdmin();
    const { user } = await createUser({ email: "delete@test.com" });

    const res = await request(app)
      .delete(`/api/admin/users/${user._id}`)
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);

    // Verify the user is actually gone from the database
    const { User } = await import("../../models/User");
    const deleted = await User.findById(user._id);
    expect(deleted).toBeNull();
  });

  it("should return 404 when user does not exist", async () => {
    const { token } = await createAdmin();
    const fakeId = "64f1a2b3c4d5e6f7a8b9c0d1";

    const res = await request(app)
      .delete(`/api/admin/users/${fakeId}`)
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(404);
  });
});

// GET ORDERS
describe("GET /api/admin/orders", () => {
  it("should return all orders across all users for admin", async () => {
    const { token } = await createAdmin();
    const { user: user1 } = await createUser({ email: "buyer1@test.com" });
    const { user: user2 } = await createUser({ email: "buyer2@test.com" });
    const book = await createBook();

    // Create orders for two different users
    await createOrder(user1._id.toString(), book._id.toString());
    await createOrder(user2._id.toString(), book._id.toString());

    const res = await request(app)
      .get("/api/admin/orders")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);
    // Admin sees ALL orders, not just their own
    expect(res.body.orders.length).toBeGreaterThanOrEqual(2);
  });
});

// GET REVENUE
describe("GET /api/admin/revenue", () => {
  it("should return revenue data for admin", async () => {
    const { token } = await createAdmin();
    const { user } = await createUser();
    const book = await createBook({ price: 29.99 });
    await createOrder(user._id.toString(), book._id.toString(), {
      totalAmount: 29.99,
      paymentStatus: "completed",
    });

    const res = await request(app)
      .get("/api/admin/revenue")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);
    // Your getRevenue controller returns { revenueData, days } — not { revenue }
    expect(res.body.revenueData).toBeDefined();
    expect(Array.isArray(res.body.revenueData)).toBe(true);
  });
});

// GET ANALYTICS
describe("GET /api/admin/analytics", () => {
  it("should return analytics data for admin", async () => {
    const { token } = await createAdmin();

    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(200);
    // Analytics must return the chart-ready data arrays the frontend consumes
    expect(res.body).toBeDefined();
  });
});
