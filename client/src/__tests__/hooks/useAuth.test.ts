import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";

// There is no useAuth hook — we test the Zustand store directly
import { useAuthStore } from "../../store/auth";

// A fake user matching the User shape in AuthState
const fakeUser = {
  id: "user-001",
  email: "kevin@example.com",
  firstName: "Kevin",
  lastName: "Mahendra",
  role: "user" as const,
  isVerified: true,
};

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset the store to its initial state before each test
    // We call logout() which sets user/token/isAuthenticated back to null/false
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.logout();
    });
  });

  // Initial state
  it("starts with user as null", () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
  });

  it("starts with token as null", () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.token).toBeNull();
  });

  it("starts with isAuthenticated as false", () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.isAuthenticated).toBe(false);
  });

  // login action
  it("sets user, token, and isAuthenticated to true after login", () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.login(fakeUser, "tok123");
    });
    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.token).toBe("tok123");
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("stores the correct user fields after login", () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.login(fakeUser, "tok123");
    });
    expect(result.current.user?.email).toBe("kevin@example.com");
    expect(result.current.user?.firstName).toBe("Kevin");
    expect(result.current.user?.role).toBe("user");
  });

  // logout action
  it("clears user, token, and sets isAuthenticated to false after logout", () => {
    const { result } = renderHook(() => useAuthStore());

    // First log in so there is something to clear
    act(() => {
      result.current.login(fakeUser, "tok123");
    });
    // Then log out
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  // updateUser action
  it("merges updated fields into the existing user without overwriting others", () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.login(fakeUser, "tok123");
    });
    act(() => {
      // Only update firstName — other fields should stay intact
      result.current.updateUser({ firstName: "Kevin Updated" });
    });

    expect(result.current.user?.firstName).toBe("Kevin Updated");
    // Fields we did not touch must be preserved
    expect(result.current.user?.email).toBe("kevin@example.com");
    expect(result.current.user?.role).toBe("user");
  });

  it("keeps user as null if updateUser is called when not logged in", () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.updateUser({ firstName: "Ghost" });
    });
    // updateUser guards against null user — should stay null
    expect(result.current.user).toBeNull();
  });

  // setToken action
  it("updates the token without touching the user", () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.login(fakeUser, "tok123");
    });
    act(() => {
      result.current.setToken("newtoken456");
    });

    expect(result.current.token).toBe("newtoken456");
    // User should be exactly as it was before
    expect(result.current.user).toEqual(fakeUser);
  });
});
