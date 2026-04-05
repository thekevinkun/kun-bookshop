import { z } from "zod";

// Small helper to avoid repeating .min(1)
const requiredString = (field: string) =>
  z.string().min(1, `${field} is required`);

const emailString = () =>
  z
    .string()
    .trim()
    .toLowerCase()
    .superRefine((value, ctx) => {
      if (!value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Email is required",
        });
        return;
      }

      if (!z.email().safeParse(value).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please provide a valid email address",
        });
      }
    });

const passwordString = (field = "Password") =>
  z.string().superRefine((value, ctx) => {
    if (!value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${field} is required`,
      });
      return;
    }

    if (value.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must be at least 8 characters",
      });
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      });
    }
  });

// --- REGISTER SCHEMA ---
export const registerSchema = z
  .object({
    email: emailString(),

    password: passwordString(),

    confirmPassword: requiredString("Please confirm your password"),

    firstName: requiredString("First name").trim(),

    lastName: requiredString("Last name").trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// --- LOGIN SCHEMA ---
export const loginSchema = z.object({
  email: emailString(),

  password: requiredString("Password"),
});

// --- FORGOT PASSWORD SCHEMA ---
export const forgotPasswordSchema = z.object({
  email: emailString(),
});

// --- RESET PASSWORD SCHEMA ---
export const resetPasswordSchema = z
  .object({
    password: passwordString(),

    confirmPassword: requiredString("Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// --- CHANGE PASSWORD SCHEMA ---
export const changePasswordSchema = z
  .object({
    currentPassword: requiredString("Current password"),

    newPassword: passwordString("New password"),

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

// --- TYPES ---
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
