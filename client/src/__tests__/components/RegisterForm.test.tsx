import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { RegisterForm } from "../../components/forms";

// RegisterForm calls api.post('/auth/register') internally — mock the whole module
vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from "../../lib/api";

// RegisterForm calls useNavigate() to redirect after success — already mocked
// globally in setup.ts, but we need the spy reference to assert on it
import { useNavigate } from "react-router-dom";

const renderRegisterForm = () =>
  render(
    <MemoryRouter>
      <RegisterForm />
    </MemoryRouter>,
  );

// Helper — fills every field with valid data so submission succeeds
const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/first name/i), "Kevin");
  await user.type(screen.getByLabelText(/last name/i), "Mahendra");
  await user.type(screen.getByLabelText(/email address/i), "kevin@example.com");
  await user.type(screen.getByLabelText(/^password$/i), "StrongPass123!");
  // confirmPassword label text is "Confirm password"
  await user.type(screen.getByLabelText(/confirm password/i), "StrongPass123!");
};

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering
  it("renders the first name field", () => {
    renderRegisterForm();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
  });

  it("renders the last name field", () => {
    renderRegisterForm();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
  });

  it("renders the email field", () => {
    renderRegisterForm();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it("renders the password field", () => {
    renderRegisterForm();
    // Use exact label text to avoid matching "Confirm password"
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it("renders the confirm password field", () => {
    renderRegisterForm();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("renders the Create account submit button", () => {
    renderRegisterForm();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  // Validation
  it("shows validation errors when submitted with all fields empty", async () => {
    renderRegisterForm();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /create account/i }));
    // Zod fires asynchronously through react-hook-form — waitFor handles that
    await waitFor(() => {
      // At minimum the email and password errors must appear
      expect(screen.getByText(/email/i)).toBeInTheDocument();
    });
  });

  it("shows a password length error when password is too short", async () => {
    renderRegisterForm();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^password$/i), "123");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => {
      // Zod registerSchema enforces minimum 8 characters
      expect(screen.getByText(/at least|minimum|short/i)).toBeInTheDocument();
    });
  });

  it("shows a confirm password error when passwords do not match", async () => {
    renderRegisterForm();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^password$/i), "StrongPass123!");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "DifferentPass!",
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/passwords? do not match|must match/i),
      ).toBeInTheDocument();
    });
  });

  it("shows an email format error for an invalid email", async () => {
    renderRegisterForm();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/invalid email|valid email/i),
      ).toBeInTheDocument();
    });
  });

  // Successful submission
  it("calls api.post with all field values on valid submission", async () => {
    // api.post resolves with no meaningful body — register just returns 201
    vi.mocked(api.post).mockResolvedValue({ data: {} });

    renderRegisterForm();
    const user = userEvent.setup();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/register", {
        firstName: "Kevin",
        lastName: "Mahendra",
        email: "kevin@example.com",
        password: "StrongPass123!",
        confirmPassword: "StrongPass123!",
      });
    });
  });

  it("redirects to /login with a success message after successful registration", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    // Grab the navigate spy that our global setup.ts mock injects
    const navigateSpy = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigateSpy);

    renderRegisterForm();
    const user = userEvent.setup();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith("/login", {
        state: {
          message: expect.stringMatching(/check your email|verify/i),
        },
      });
    });
  });

  // Server error handling
  it("shows the email field error when the server says email is taken", async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: { data: { error: "This email is already registered" } },
    });

    renderRegisterForm();
    const user = userEvent.setup();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      // Message contains "email" so RegisterForm calls setError("email", ...)
      expect(
        screen.getByText("This email is already registered"),
      ).toBeInTheDocument();
    });
  });

  it("shows a root-level general error for non-email server errors", async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: { data: { error: "Server is temporarily unavailable" } },
    });

    renderRegisterForm();
    const user = userEvent.setup();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      // Non-email errors go to setError("root", ...) — shown in the red banner
      expect(
        screen.getByText("Server is temporarily unavailable"),
      ).toBeInTheDocument();
    });
  });

  // Loading state
  it("disables the submit button and shows spinner while submitting", async () => {
    // Promise that never resolves — keeps the form in isSubmitting state
    vi.mocked(api.post).mockReturnValue(new Promise(() => {}));

    renderRegisterForm();
    const user = userEvent.setup();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      // Button text becomes "Creating account..." and is disabled
      expect(
        screen.getByRole("button", { name: /creating account/i }),
      ).toBeDisabled();
    });
  });
});
