// Import Resend — replaces Nodemailer as our email sender (works on Railway, no SMTP ports needed)
import { Resend } from "resend";

// Import handlebars — the templating engine that fills in dynamic values in our email HTML
import handlebars from "handlebars";

// Import fs and path — built-in Node modules for reading template files from disk
import fs from "fs";
import path from "path";

import { Book } from "../models/Book";
import type { ICoupon } from "../types/order";

// Import our logger — no console.log in this project
import { logger } from "../utils/logger";

// Initialize the Resend client once using our API key from .env
// Resend sends over HTTPS (port 443) — not blocked by Railway like SMTP ports are
const resend = new Resend(process.env.RESEND_API_KEY);

// LOAD AND COMPILE TEMPLATE
// Reads an .hbs template file from disk and compiles it with Handlebars
// templateName: the filename without extension (e.g. 'welcome', 'verification')
// data: the dynamic values to inject into the template (e.g. { firstName, verificationUrl })
const compileTemplate = (
  templateName: string,
  data: Record<string, unknown>,
): string => {
  // Build the full path to the template file
  // __dirname is the current directory (services/), then we go up and into templates/
  const templatePath = path.join(
    __dirname,
    "../templates/emails",
    `${templateName}.hbs`,
  );

  // Read the template file as a UTF-8 string
  const templateSource = fs.readFileSync(templatePath, "utf-8");

  // Handlebars.compile() turns the template string into a function
  // We then call that function with our data to get the final HTML string
  const template = handlebars.compile(templateSource);

  // Return the final HTML with all {{ variables }} replaced with real values
  return template(data);
};

// SEND EMAIL
// The core function — builds the email and sends it via Resend's HTTPS API
// All other email functions (sendVerificationEmail, etc.) call this one
const sendEmail = async (
  to: string, // Recipient email address
  subject: string, // Email subject line
  html: string, // The compiled HTML body
): Promise<void> => {
  // Send the email using Resend — works on Railway because it uses HTTPS not SMTP
  const { error } = await resend.emails.send({
    from: "Kun Bookshop <onboarding@resend.dev>", // Use this until you have a verified custom domain
    to: process.env.RESEND_TEST_EMAIL || to,
    subject,
    html, // The full rendered HTML string from our Handlebars template
  });

  // If Resend returns an error object, log it and throw so the caller knows it failed
  if (error) {
    logger.error("Resend email failed", { error });
    throw new Error(`Failed to send email: ${error.message}`);
  }

  logger.info(`Email sent via Resend to: ${to} | Subject: ${subject}`);
};

// SEND VERIFICATION EMAIL
// Called after a user registers — sends them a link to verify their email address
export const sendVerificationEmail = async (
  email: string,
  token: string, // The random verification token we stored in the User document
): Promise<void> => {
  // Build the full verification URL that the user clicks in their email
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  // Compile the verification template with the values this email needs
  const html = compileTemplate("verification", {
    verificationUrl, // The clickable link
    logoUrl: process.env.LOGO_URL,
    supportUrl: `${process.env.CLIENT_URL}/contact`,
  });

  await sendEmail(email, "Verify your Kun Bookshop account", html);
  logger.info(`Verification email sent to: ${email}`);
};

// SEND WELCOME EMAIL
// Called after the user successfully verifies their email
export const sendWelcomeEmail = async (
  email: string,
  firstName: string, // We personalize the greeting with their first name
): Promise<void> => {
  const html = compileTemplate("welcome", {
    firstName, // Used in the template as {{ firstName }}
    shopUrl: process.env.CLIENT_URL, // Link to the homepage
    logoUrl: process.env.LOGO_URL,
    supportUrl: `${process.env.CLIENT_URL}/contact`,
  });

  await sendEmail(email, "Welcome to Kun Bookshop!", html);
  logger.info(`Welcome email sent to: ${email}`);
};

// SEND PASSWORD RESET EMAIL
// Called when a user submits the forgot password form
export const sendPasswordResetEmail = async (
  email: string,
  token: string, // The random reset token we stored in the User document
): Promise<void> => {
  // Build the full reset URL — user clicks this to land on the reset password page
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const html = compileTemplate("passwordReset", {
    resetUrl,
    expiresIn: "1 hour", // Tell the user how long they have to use this link
    logoUrl: process.env.LOGO_URL,
    supportUrl: `${process.env.CLIENT_URL}/contact`,
  });

  await sendEmail(email, "Reset your Kun Bookshop password", html);
  logger.info(`Password reset email sent to: ${email}`);
};

// SEND PASSWORD CHANGED EMAIL
// Called after a user successfully changes or resets their password
// This is a security notification — if someone DIDN'T make this change, they know to act fast
export const sendPasswordChangedEmail = async (
  email: string,
): Promise<void> => {
  const html = compileTemplate("passwordChanged", {
    logoUrl: process.env.LOGO_URL,
    supportUrl: `${process.env.CLIENT_URL}/contact`, // Link to contact support if it wasn't them
  });

  await sendEmail(email, "Your Kun Bookshop password was changed", html);
  logger.info(`Password changed confirmation email sent to: ${email}`);
};

// SEND ORDER CONFIRMATION EMAIL
// Called by the webhook after a payment is confirmed
// Sends the user a receipt with their order number and book list
export const sendOrderConfirmation = async (
  email: string,
  order: any, // IOrder — using any to avoid circular import issues
): Promise<void> => {
  // Fetch fileType for each book in the order from the Book collection
  // The order snapshot doesn't store fileType — only the Book model has it
  // We do a single query fetching all books at once to avoid N+1 DB calls
  const bookIds = order.items.map((item: any) => item.bookId); // Collect all bookIds from the order
  const books = await Book.find({ _id: { $in: bookIds } }) // Fetch all matching books in one query
    .select("fileType") // We only need fileType — keep the query lean
    .lean(); // Return plain objects, not Mongoose documents

  // Build a lookup map: bookId string → fileType
  // This lets us match each order item to its fileType in O(1) instead of looping
  const fileTypeMap = new Map<string, string>(
    books.map((b: any) => [b._id.toString(), b.fileType]), // Key is string so it matches item.bookId.toString()
  );

  // Determine if a coupon discount was applied to this order
  // discount > 0 means the user saved money — we show the breakdown in the email
  const hasDiscount = order.discount > 0;

  const html = compileTemplate("orderConfirmation", {
    orderNumber: order.orderNumber,
    // Build each item with fileType looked up from the map
    items: order.items.map((item: any) => ({
      title: item.title,
      author: item.author, // denormalized snapshot string — never item.bookId
      price: Number(item.price).toFixed(2), // Format to 2 decimal places e.g. "9.99"
      coverImage: item.coverImage,
      fileType: fileTypeMap.get(item.bookId.toString()) ?? "pdf", // Fallback to pdf if somehow missing
    })),
    subtotal: order.subtotal.toFixed(2), // Before discount
    discount: order.discount.toFixed(2), // Amount saved
    couponCode: order.couponCode, // e.g. "SAVE20" — shown next to the discount label
    hasDiscount, // Boolean — Handlebars {{#if hasDiscount}} uses this
    total: order.total.toFixed(2), // What was actually charged
    logoUrl: process.env.LOGO_URL,
    libraryUrl: `${process.env.CLIENT_URL}/library`,
    supportUrl: `${process.env.CLIENT_URL}/contact`,
  });

  await sendEmail(email, `Order Confirmed - #${order.orderNumber} 📚`, html);
  logger.info(`Order confirmation email sent to: ${email}`, {
    orderNumber: order.orderNumber,
  });
};

// sendCouponBlast — sends the coupon email to a single user
// Called in a loop by the email-blast controller, one call per user
// We keep it as a single-user function so failures are isolated per recipient
export const sendCouponBlast = async (
  email: string, // Recipient's email address
  firstName: string, // Used in the greeting line "Hi Kevin,"
  coupon: ICoupon, // The full coupon document from MongoDB
): Promise<void> => {
  const html = compileTemplate("coupon", {
    firstName, // Greeting name
    code: coupon.code, // e.g. "SAVE20"
    isPercentage: coupon.discountType === "percentage", // Drives {{#if isPercentage}} block
    discountValue: coupon.discountValue, // e.g. 20 (for 20% or $20)
    maxDiscount: coupon.maxDiscount, // Optional cap
    minPurchase: coupon.minPurchase, // Optional minimum
    validUntil: new Date(coupon.validUntil).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric", // e.g. "December 31, 2026"
    }),
    logoUrl: process.env.LOGO_URL,
    shopUrl: process.env.CLIENT_URL ?? "http://localhost:3000/books", // CTA button link
    supportUrl: `${process.env.CLIENT_URL}/contact`,
    year: new Date().getFullYear(), // Footer copyright year
  });

  await sendEmail(email, `Your exclusive coupon: ${coupon.code}`, html);
  logger.info(`Coupon has been sent to: ${email}`, {
    code: coupon.code,
  });
};
