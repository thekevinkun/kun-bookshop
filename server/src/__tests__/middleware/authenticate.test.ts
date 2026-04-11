import jwt from "jsonwebtoken";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateAccessToken } from "../../utils/jwt";
import { authenticate } from "../../middleware/auth.middleware";

// Helper that builds a fake Express req/res/next triple
// This lets us call middleware directly without spinning up a server
function buildReqResNext(token?: string) {
  const req: any = {
    cookies: token ? { token } : {},
    // Your real middleware also reads req.headers.authorization as a fallback
    // Without this, req.headers is undefined and optional chaining throws
    headers: {},
  };

  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };

  const next = vi.fn();

  return { req, res, next };
}

describe("authenticate middleware", () => {
  beforeEach(() => {
    // Clear all spy call records before each test so they don't bleed into each other
    vi.clearAllMocks();
  });

  it("should call next() and attach user to req when token is valid", async () => {
    // Generate a real token using our actual utility function
    const token = generateAccessToken("user123", "test@test.com", "user");
    const { req, res, next } = buildReqResNext(token);

    await authenticate(req, res, next);

    // Middleware must have called next() — meaning the request continues
    expect(next).toHaveBeenCalledOnce();

    // Middleware must have attached the decoded user to req.user
    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe("user123");
    expect(req.user.email).toBe("test@test.com");
    expect(req.user.role).toBe("user");
  });

  it("should return 401 when no token is provided", async () => {
    const { req, res, next } = buildReqResNext(); // No token

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled(); // Request must be blocked
  });

  it("should return 401 when token is expired", async () => {
    // Sign a token that expired 1 second ago using the real secret
    const expiredToken = jwt.sign(
      { userId: "user123", email: "test@test.com", role: "user" },
      process.env.JWT_SECRET!,
      { expiresIn: "-1s" }, // Negative duration = already expired
    );
    const { req, res, next } = buildReqResNext(expiredToken);

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when token is malformed", async () => {
    const { req, res, next } = buildReqResNext("not.a.real.jwt");

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when token is signed with wrong secret", async () => {
    const fakeToken = jwt.sign(
      { userId: "user123", email: "test@test.com", role: "user" },
      "completely-wrong-secret",
    );
    const { req, res, next } = buildReqResNext(fakeToken);

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
