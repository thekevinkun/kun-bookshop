import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { LoginForm } from "../../components/forms";

// Mock dependencies LoginForm uses internally
// LoginForm calls api.post('/auth/login') and useAuthStore().login
// We mock both so no real HTTP calls happen and we control the outcome

const loginStoreSpy = vi.fn();

vi.mock("@/store/auth", () => ({
  useAuthStore: vi.fn(() => ({ login: loginStoreSpy })),
}));

// Mock our axios instance — api.post is what LoginForm calls
vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from "../../lib/api";

// Wrap in MemoryRouter because LoginForm calls useNavigate()
const renderLoginForm = () =>
  render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  );

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering
  it("renders the email field with its label", () => {
    renderLoginForm();
    // htmlFor="email" links the label to the input
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it("renders the password field with its label", () => {
    renderLoginForm();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders the Sign in submit button", () => {
    renderLoginForm();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("renders the forgot password link", () => {
    renderLoginForm();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
  });

  // Validation
  it("shows an email required error when submitted with empty email", async () => {
    renderLoginForm();
    const user = userEvent.setup();
    // Submit without filling anything in
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    // Zod + react-hook-form shows the error asynchronously
    await waitFor(() => {
      expect(screen.getByText(/email/i)).toBeInTheDocument();
    });
  });

  it("shows a password error when submitted with no password", async () => {
    renderLoginForm();
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/email address/i),
      "kevin@example.com",
    );
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/password/i)).toBeInTheDocument();
    });
  });

  // Successful submission
  it("calls api.post with email and password on valid submission", async () => {
    // Make api.post resolve successfully with a fake user + token
    vi.mocked(api.post).mockResolvedValue({
      data: { user: { id: "u1", email: "kevin@example.com" }, token: "tok123" },
    });

    renderLoginForm();
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/email address/i),
      "kevin@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/login", {
        email: "kevin@example.com",
        password: "Password123!",
      });
    });
  });

  it("calls the Zustand login action with user and token on success", async () => {
    const fakeUser = { id: "u1", email: "kevin@example.com" };
    vi.mocked(api.post).mockResolvedValue({
      data: { user: fakeUser, token: "tok123" },
    });

    renderLoginForm();
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/email address/i),
      "kevin@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(loginStoreSpy).toHaveBeenCalledWith(fakeUser, "tok123");
    });
  });

  // Server error
  it("shows the server error message on the password field when login fails", async () => {
    // Simulate a 401 from the server
    vi.mocked(api.post).mockRejectedValue({
      response: { data: { error: "Invalid credentials" } },
    });

    renderLoginForm();
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/email address/i),
      "kevin@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      // LoginForm uses setError("password", { message }) for server errors
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  // Loading state
  it("disables the submit button and shows spinner while submitting", async () => {
    // Never resolves — keeps the form in submitting state
    vi.mocked(api.post).mockReturnValue(new Promise(() => {}));

    renderLoginForm();
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText(/email address/i),
      "kevin@example.com",
    );
    await user.type(screen.getByLabelText(/password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      // Button text changes to "Signing in..." and becomes disabled
      expect(
        screen.getByRole("button", { name: /signing in/i }),
      ).toBeDisabled();
    });
  });
});
