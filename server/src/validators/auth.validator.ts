import { z } from "zod";

// Small helper to avoid repeating .min(1)
const requiredString = (field: string) =>
  z.string().min(1, `${field} is required`);

// REGISTER SCHEMA
export const registerSchema = z
  .object({
    email: requiredString("Email")
      .email("Please provide a valid email address")
      .toLowerCase()
      .trim(),

    password: requiredString("Password")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),

    confirmPassword: requiredString("Please confirm your password"),

    firstName: requiredString("First name").trim(),

    lastName: requiredString("Last name").trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// LOGIN SCHEMA
export const loginSchema = z.object({
  email: requiredString("Email")
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim(),

  password: requiredString("Password"),
});

// FORGOT PASSWORD SCHEMA
export const forgotPasswordSchema = z.object({
  email: requiredString("Email")
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim(),
});

// RESET PASSWORD SCHEMA
export const resetPasswordSchema = z
  .object({
    password: requiredString("Password")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),

    confirmPassword: requiredString("Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// CHANGE PASSWORD SCHEMA
export const changePasswordSchema = z
  .object({
    currentPassword: requiredString("Current password"),

    newPassword: requiredString("New password")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),

    confirmNewPassword: requiredString("Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });

// TYPES
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
