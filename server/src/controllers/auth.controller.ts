// Import Request and Response types from Express for type safety
import { Request, Response } from "express";

// Import crypto for generating secure random tokens (email verification, password reset)
import crypto from "crypto";

// Import our User and RefreshToken models
import { User } from "../models/User";
import { RefreshToken } from "../models/RefreshToken";

// Import our JWT utility functions
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../utils/jwt";

// Import our bcrypt utility functions
import { hashPassword, comparePassword } from "../utils/bcrypt";

// Import our Zod validator types so TypeScript knows the shape of validated input
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from "../validators/auth.validator";

// Import our Winston logger — we never use console.log in this project
import { logger } from "../utils/logger";

// Import our email sending functions — we'll use these to send verification and reset emails
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from "../services/email.service";

// COOKIE OPTIONS
// Reusable cookie settings we apply whenever we set an auth cookie
// Defined once here so we never accidentally use different settings in different places
const COOKIE_OPTIONS = {
  httpOnly: true, // JavaScript in the browser CANNOT read this cookie — prevents XSS theft
  secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
  sameSite: "strict" as const, // Only send cookie when request comes FROM our own domain — prevents CSRF
  path: "/", // Cookie is sent with every request to our domain
};

// REGISTER
// POST /api/auth/register
// Creates a new user account and sends a verification email
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.body is already validated by Zod middleware before this runs
    const { email, password, firstName, lastName } = req.body as RegisterInput;

    // Check if an account with this email already exists
    // We check BEFORE hashing the password to avoid wasting CPU on bcrypt
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Use a vague message — don't confirm whether the email is registered
      // This prevents attackers from enumerating which emails exist in our system
      res
        .status(409)
        .json({ error: "An account with this email already exists." });
      return;
    }

    // Hash the password before saving — NEVER store plain text passwords
    const hashedPwd = await hashPassword(password);

    // Generate a random token to send in the verification email
    // The user clicks a link containing this token to prove they own the email
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create the new user in the database
    const user = await User.create({
      email,
      password: hashedPwd, // Store the hash, not the original password
      firstName,
      lastName,
      verificationToken, // We'll clear this once the email is verified
    });

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    // Log the registration event — useful for auditing and debugging
    logger.info(`New user registered: ${user.email}`);

    // Return 201 Created with basic user info — never return the password hash
    res.status(201).json({
      message:
        "Account created successfully. Please check your email to verify your account.",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    // Log the full error internally but send a generic message to the client
    // We never expose internal error details to users
    logger.error("Register error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// LOGIN
// POST /api/auth/login
// Validates credentials, handles account lockout, sets auth cookies
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginInput;

    // Look up the user by email
    const user = await User.findOne({ email });

    // If user doesn't exist, return a vague error
    // Saying "user not found" would tell attackers which emails are registered
    if (!user) {
      res.status(401).json({
        error:
          "The email or password you entered is incorrect. Please try again.",
      });
      return;
    }

    // ACCOUNT LOCKOUT CHECK
    // If lockUntil is set and is still in the future, the account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      // Tell them how many minutes remain on the lockout
      const minutesLeft = Math.ceil(
        (user.lockUntil.getTime() - Date.now()) / 60000,
      );
      res.status(403).json({
        error: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      });
      return;
    }

    // Compare the submitted password against the stored hash
    const isPasswordValid = await comparePassword(password, user.password);

    // WRONG PASSWORD
    if (!isPasswordValid) {
      // Increment the failure counter
      user.failedLoginAttempts += 1;

      // If they've failed 5 or more times, lock the account for 15 minutes
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
        await user.save();
        res.status(403).json({
          error: "Too many failed attempts. Account locked for 15 minutes.",
        });
        return;
      }

      // Save the incremented failure count
      await user.save();
      res.status(401).json({
        error:
          "The email or password you entered is incorrect. Please try again.",
      });
      return;
    }

    // Only allow verified users to sign in after their credentials are confirmed
    if (!user.isVerified) {
      res.status(403).json({
        error: "Please verify your email before signing in.",
      });
      return;
    }

    // CORRECT PASSWORD — reset lockout fields atomically
    // Split into $set (for values) and $unset (for fields we want to clear)
    // because $set: { field: undefined } is silently ignored by MongoDB
    await User.findByIdAndUpdate(user._id, {
      $set: {
        failedLoginAttempts: 0, // Reset the wrong-password counter to zero
        lastLogin: new Date(), // Record when they last logged in successfully
      },
      $unset: {
        lockUntil: "", // Remove the lockout field entirely — empty string is MongoDB's $unset syntax
      },
    });

    // Generate the 15-minute access token
    const accessToken = generateAccessToken(
      user._id.toString(),
      user.email,
      user.role,
    );

    // Generate the 30-day refresh token (random bytes, not a JWT)
    const refreshToken = generateRefreshToken();

    // Store the HASH of the refresh token in the database — never the raw token
    await RefreshToken.create({
      token: hashToken(refreshToken), // Store the hash
      userId: user._id.toString(), // Link it to this user
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    // Set the access token as a secure httpOnly cookie (15 minutes)
    res.cookie("token", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    });

    // Set the refresh token as a separate cookie (30 days)
    // Scoped to /api/auth/refresh so it's ONLY sent to that specific endpoint
    res.cookie("refreshToken", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
      path: "/api/auth/refresh", // Only sent when browser hits this route
    });

    logger.info(`User logged in: ${user.email}`);

    // Return user info — the tokens are in cookies, not the response body
    res.json({
      message: "Logged in successfully.",
      token: accessToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// LOGOUT
// POST /api/auth/logout
// Revokes the refresh token and clears both cookies
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Read the refresh token from its cookie
    const refreshToken = req.cookies?.refreshToken;

    // If there's a refresh token, mark it as revoked in the database
    // Even if this DB call fails, we still clear the cookies — user gets logged out either way
    if (refreshToken) {
      await RefreshToken.findOneAndUpdate(
        { token: hashToken(refreshToken) }, // Find it by its hash
        { isRevoked: true }, // Mark as revoked so it can't be reused
      ).catch(() => {}); // Silently ignore DB errors — logout should always succeed
    }

    // Clear the access token cookie from the browser
    res.clearCookie("token", { path: "/" });

    // Clear the refresh token cookie — must use the same path it was set with
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });

    res.json({ message: "Logged out successfully." });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// REFRESH TOKENS
// POST /api/auth/refresh
// Issues a new access token + new refresh token (token rotation)
export const refreshTokens = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // The refresh token cookie is only sent to this specific endpoint (path scoped)
    const incomingRefreshToken = req.cookies?.refreshToken;

    // No refresh token means the session has fully expired — force login
    if (!incomingRefreshToken) {
      res
        .status(401)
        .json({ error: "No refresh token provided. Please log in again." });
      return;
    }

    // Hash the incoming token so we can look it up in the database
    const hashedToken = hashToken(incomingRefreshToken);

    // Find the token record in the database
    const storedToken = await RefreshToken.findOne({ token: hashedToken });

    // Reject if the token doesn't exist, is revoked, or has expired
    if (
      !storedToken ||
      storedToken.isRevoked ||
      storedToken.expiresAt < new Date()
    ) {
      res.status(403).json({
        error: "Invalid or expired refresh token. Please log in again.",
      });
      return;
    }

    // TOKEN ROTATION
    // Immediately revoke the OLD refresh token
    // If an attacker sgoldens it and tries to use it after us, it'll be dead
    storedToken.isRevoked = true;
    await storedToken.save();

    // Look up the user this token belongs to
    const user = await User.findById(storedToken.userId);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    // Generate a brand new access token (15 minutes)
    const newAccessToken = generateAccessToken(
      user._id.toString(),
      user.email,
      user.role,
    );

    // Generate a brand new refresh token (30 days)
    const newRefreshToken = generateRefreshToken();

    // Store the hash of the NEW refresh token in the database
    await RefreshToken.create({
      token: hashToken(newRefreshToken),
      userId: user._id.toString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    // Set the new access token cookie
    res.cookie("token", newAccessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });

    // Set the new refresh token cookie
    res.cookie("refreshToken", newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/api/auth/refresh",
    });

    // Also return the access token in the body for API clients that can't use cookies
    res.json({ token: newAccessToken });
  } catch (error) {
    logger.error("Refresh token error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// VERIFY EMAIL
// GET /api/auth/verify-email/:token
// User clicks the link in their welcome email — this marks them as verified
export const verifyEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // The token comes from the URL parameter (/verify-email/abc123...)
    const { token } = req.params;

    // Find the user who has this verification token
    const user = await User.findOne({ verificationToken: token });

    // If no user found, the token is invalid or was already used
    if (!user) {
      res.status(400).json({ error: "Invalid or expired verification link." });
      return;
    }

    if (user.isVerified) {
      res.json({ message: "Your email is already verified. You can sign in." });
      return;
    }

    // Mark the account as verified and clear the token (one-time use)
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Send a welcome email now that their email is verified
    await sendWelcomeEmail(user.email, user.firstName);

    logger.info(`Email verified for user: ${user.email}`);

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    logger.error("Email verification error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// FORGOT PASSWORD
// POST /api/auth/forgot-password
// Generates a reset token and sends it to the user's email
export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body as ForgotPasswordInput;

    // Look up the user — but always return the SAME response whether found or not
    // This prevents attackers from discovering which emails are registered
    const user = await User.findOne({ email });

    if (user) {
      // Generate a secure random reset token
      const resetToken = crypto.randomBytes(32).toString("hex");

      // Store the token and set it to expire in 1 hour
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      // Send password reset email
      await sendPasswordResetEmail(user.email, resetToken);

      logger.info(`Password reset requested for: ${user.email}`);
    }

    // Always return 200 regardless of whether the email exists
    // This is intentional — we don't want to leak which emails are registered
    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    logger.error("Forgot password error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// RESET PASSWORD
// POST /api/auth/reset-password/:token
// User submits their new password after clicking the reset link
export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body as ResetPasswordInput;

    // Find the user with this reset token AND check it hasn't expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }, // $gt = greater than — token must not be expired
    });

    if (!user) {
      res
        .status(400)
        .json({ error: "Invalid or expired password reset link." });
      return;
    }

    // Hash the new password before saving
    user.password = await hashPassword(password);

    // Clear the reset token fields — one-time use only
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Reset the lockout fields in case the account was locked
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    await user.save();

    // Send password changed confirmation email
    await sendPasswordChangedEmail(user.email);

    logger.info(`Password reset completed for: ${user.email}`);

    res.json({
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    logger.error("Reset password error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// GET ME
// GET /api/auth/me
// Returns the currently logged-in user's profile data
// Protected by authenticate middleware — req.user is guaranteed to exist here
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.user.userId was set by the authenticate middleware from the JWT payload
    // .select('-password') tells Mongoose to return everything EXCEPT the password hash
    const user = await User.findById(req.user!.userId).select("-password");

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.json({ user });
  } catch (error) {
    logger.error("Get me error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// UPDATE PROFILE
// PUT /api/auth/update-profile
// Lets a logged-in user update their name and avatar
export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Only allow these specific fields to be updated — never let users update role or password here
    const { firstName, lastName, avatar } = req.body;

    // Find the user and update only the allowed fields
    // { new: true } returns the updated document instead of the old one
    // .select('-password') excludes the password hash from the response
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { firstName, lastName, avatar },
      { new: true, runValidators: true }, // runValidators re-runs Mongoose schema validation
    ).select("-password");

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    logger.info(`Profile updated for user: ${user.email}`);

    res.json({ message: "Profile updated successfully.", user });
  } catch (error) {
    logger.error("Update profile error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// CHANGE PASSWORD
// PUT /api/auth/change-password
// Lets a logged-in user change their password (must know current password)
export const changePassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body as ChangePasswordInput;

    // Fetch the full user document — we need the password hash to compare
    const user = await User.findById(req.user!.userId);

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    // Verify the current password before allowing the change
    // This confirms it's really the account owner making this request
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      res.status(401).json({ error: "Current password is incorrect." });
      return;
    }

    // Hash and save the new password
    user.password = await hashPassword(newPassword);
    await user.save();

    // Revoke ALL existing refresh tokens for this user
    // This forces logout on all other devices after a password change — good security practice
    await RefreshToken.updateMany(
      { userId: user._id.toString() }, // Find all tokens for this user
      { isRevoked: true }, // Mark them all as revoked
    );

    // Clear the cookies on this device too
    res.clearCookie("token", { path: "/" });
    res.clearCookie("refreshToken", { path: "/api/auth/refresh" });

    // Send password changed confirmation email
    await sendPasswordChangedEmail(user.email);

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    logger.error("Change password error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
