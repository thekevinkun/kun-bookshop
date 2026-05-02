// Import Express Router — this lets us define routes separately from the main server file
import { Router } from "express";

// Import the validate middleware helper we'll create inline below
// It runs Zod validation before the request reaches the controller
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

// Import all our controller functions
import {
  register,
  login,
  logout,
  refreshTokens,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
  uploadAvatar,
  removeAvatar,
} from "../controllers/auth.controller";

// Import our middleware
import { authenticate } from "../middleware/auth.middleware";
import {
  uploadAvatarFile,
  verifyFileTypes,
} from "../middleware/upload.middleware";
import {
  forgotPasswordLimiter,
  loginLimiter,
  registerLimiter,
} from "../middleware/rateLimiter.middleware";

// Create the router instance — we'll attach all auth routes to this
const router = Router();

// ZOD VALIDATION MIDDLEWARE
// A small reusable helper that validates req.body against a Zod schema
// If validation fails, it returns a 400 with the exact error messages
// If validation passes, it replaces req.body with the parsed (cleaned) data
const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // schema.safeParse() validates without throwing — returns { success, data, error }
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Zod gives us an array of issues — we map them to readable { field, message } objects
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."), // e.g. 'confirmPassword' or 'emailPreferences.marketing'
        message: issue.message, // The human-readable error message we defined in the schema
      }));

      res.status(400).json({ errors });
      return; // Stop here — don't let invalid data reach the controller
    }

    // Replace req.body with the parsed data
    // Zod strips unknown fields and applies transformations (like .toLowerCase(), .trim())
    req.body = result.data;
    next(); // Validation passed — proceed to the controller
  };
};

// Import our Zod schemas for validation
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validators/auth.validator";

// PUBLIC ROUTES
// These routes do NOT require the user to be logged in

// POST /api/auth/register — create a new account
// registerLimiter: limits account creation attempts per IP to reduce signup spam
// validate(registerSchema): checks email format, password strength, names are present
router.post("/register", registerLimiter, validate(registerSchema), register);

// POST /api/auth/login — log in with email and password
// loginLimiter: counts failed sign-in attempts to slow brute-force attacks
router.post("/login", loginLimiter, validate(loginSchema), login);

// POST /api/auth/logout — clear auth cookies and revoke refresh token
// No auth required — even a logged-out user should be able to hit this safely
router.post("/logout", logout);

// POST /api/auth/refresh — get a new access token using the refresh token cookie
// No auth middleware here — the refresh token IS the credential for this route
router.post("/refresh", refreshTokens);

// GET /api/auth/verify-email/:token — user clicks link from their verification email
// The token comes from the URL, not the body — no body validation needed
router.get("/verify-email/:token", verifyEmail);

// POST /api/auth/forgot-password — request a password reset email
// forgotPasswordLimiter: slows repeated reset requests from the same IP
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);

// POST /api/auth/reset-password/:token — submit new password using the reset link token
router.post(
  "/reset-password/:token",
  validate(resetPasswordSchema),
  resetPassword,
);

// PROTECTED ROUTES
// These routes require a valid access token — authenticate middleware runs first

// GET /api/auth/me — get the currently logged-in user's profile
router.get("/me", authenticate, getMe);

// POST /api/auth/upload-avatar — upload and crop a new profile avatar
// uploadAvatarFile: multer reads the multipart file into memory
// verifyFileTypes: magic byte check confirms it's a real image
// authenticate: must be logged in
router.post(
  "/upload-avatar",
  authenticate,
  uploadAvatarFile,
  verifyFileTypes,
  uploadAvatar,
);

// DELETE /api/auth/avatar — remove the user's profile avatar
// Deletes from Cloudinary and clears avatar fields — falls back to initials
router.delete("/avatar", authenticate, removeAvatar);

// PUT /api/auth/update-profile — update name or avatar
router.put("/update-profile", authenticate, updateProfile);

// PUT /api/auth/change-password — change password while logged in
router.put(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changePassword,
);

// Export the router so server.ts can mount it
export default router;
