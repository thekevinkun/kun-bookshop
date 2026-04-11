import { describe, it, expect, vi, beforeEach } from "vitest";
import { isAdmin } from "../../middleware/admin.middleware";

function buildReqResNext(role: string) {
  const req: any = {
    // isAdmin reads from req.user which authenticate already populated
    user: { userId: "abc123", email: "test@test.com", role },
  };

  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };

  const next = vi.fn();

  return { req, res, next };
}

describe("isAdmin middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call next() when user role is admin", () => {
    const { req, res, next } = buildReqResNext("admin");

    isAdmin(req, res, next);

    // Admin users must pass through to the next handler
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 403 when user role is user", () => {
    const { req, res, next } = buildReqResNext("user");

    isAdmin(req, res, next);

    // Regular users must be blocked with Forbidden — not Unauthorized
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when req.user is missing entirely", () => {
    const req: any = {};
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    const next = vi.fn();

    isAdmin(req, res, next);

    // req.user is missing — user isn't authenticated at all, so 401 is correct
    // (403 would mean authenticated but not authorized — that's a different case)
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
