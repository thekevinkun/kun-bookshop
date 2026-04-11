import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../../utils/jwt";

describe("generateAccessToken", () => {
  it("should return a valid signed JWT string", () => {
    // Call the function with test values
    const token = generateAccessToken("user123", "test@test.com", "user");

    // A JWT always has exactly three dot-separated parts
    expect(token.split(".")).toHaveLength(3);
  });

  it("should embed userId, email, and role in the payload", () => {
    const token = generateAccessToken("user123", "test@test.com", "user");

    // Decode (not verify) the token to inspect its payload
    const decoded = jwt.decode(token) as Record<string, any>;

    expect(decoded.userId).toBe("user123");
    expect(decoded.email).toBe("test@test.com");
    expect(decoded.role).toBe("user");
  });

  it("should be verifiable with the JWT_SECRET from env", () => {
    const token = generateAccessToken("user123", "test@test.com", "user");

    // jwt.verify throws if the secret is wrong or the token is tampered — no throw means success
    expect(() => jwt.verify(token, process.env.JWT_SECRET!)).not.toThrow();
  });

  it("should fail verification with a wrong secret", () => {
    const token = generateAccessToken("user123", "test@test.com", "user");

    // A token signed with our secret must not verify with a different secret
    expect(() => jwt.verify(token, "wrong-secret")).toThrow();
  });
});

describe("generateRefreshToken", () => {
  it("should return a 128-character hex string", () => {
    // 64 random bytes → 128 hex characters
    const token = generateRefreshToken();
    expect(token).toHaveLength(128);
    expect(token).toMatch(/^[a-f0-9]+$/); // Only valid hex characters
  });

  it("should return a different value on every call", () => {
    // Tokens must be unique — same function call must never produce duplicates
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a).not.toBe(b);
  });
});

describe("hashToken", () => {
  it("should return a 64-character hex string (SHA-256 output)", () => {
    const hashed = hashToken("some-random-token");
    expect(hashed).toHaveLength(64);
    expect(hashed).toMatch(/^[a-f0-9]+$/);
  });

  it("should return the same hash for the same input every time", () => {
    // SHA-256 is deterministic — same input always produces the same output
    const a = hashToken("same-token");
    const b = hashToken("same-token");
    expect(a).toBe(b);
  });

  it("should return different hashes for different inputs", () => {
    const a = hashToken("token-one");
    const b = hashToken("token-two");
    expect(a).not.toBe(b);
  });
});
