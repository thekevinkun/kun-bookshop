// Test data factories — functions that create valid test objects in the database
// Using factories avoids copy-pasting the same setup code across every test file
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../../models/User";
import { Book } from "../../models/Book";
import { Order } from "../../models/Order";
import { Coupon } from "../../models/Coupon";
import { generateAccessToken } from "../../utils/jwt";

// USER FACTORY
// Creates a regular (non-admin) user in the database and returns the document + a valid token
// Pass overrides to customise any field: createUser({ email: 'custom@test.com' })
export async function createUser(overrides: Record<string, any> = {}) {
  // Hash a plain text password so we can test login with 'password123'
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Build the user document — merge in any overrides on top of the defaults
  const user = await User.create({
    firstName: "Test",
    lastName: "User",
    email: `user-${Date.now()}@test.com`, // Unique email per call (avoids duplicate key errors)
    password: hashedPassword,
    role: "user",
    isVerified: true, // Pre-verified so tests don't need to go through email flow
    emailPreferences: {
      marketing: true,
      orderUpdates: true,
      newReleases: true,
      priceDrops: true,
    },
    ...overrides, // Allow callers to override any field
  });

  // Generate a valid JWT for this user so tests can make authenticated requests
  const token = generateAccessToken(user._id.toString(), user.email, user.role);

  // Return both the user document and the token — tests need both
  return { user, token };
}

// Creates an admin user — same as createUser but with role: 'admin'
export async function createAdmin(overrides: Record<string, any> = {}) {
  return createUser({
    role: "admin",
    email: `admin-${Date.now()}@test.com`,
    ...overrides,
  });
}

// BOOK FACTORY
// Creates a book in the database and returns the document
export async function createBook(overrides: Record<string, any> = {}) {
  const book = await Book.create({
    title: "Test Book",
    author: new mongoose.Types.ObjectId().toString(),
    authorName: "Test Author",
    description: "<p>A test book description.</p>",
    price: 19.99,
    coverImage: "https://res.cloudinary.com/test/image/upload/cover.jpg",
    fileUrl: "https://res.cloudinary.com/test/raw/upload/book.pdf",
    filePublicId: "books/test-book",
    fileType: "pdf",
    fileSize: 1024 * 500,
    category: ["Fiction"],
    tags: ["test"],
    rating: 4.5,
    reviewCount: 10,
    purchaseCount: 5,
    isActive: true,
    isFeatured: false,
    previewPages: 5,
    publishedDate: new Date("2024-01-01"),
    ...overrides,
  });

  return book;
}

// ORDER FACTORY
// Creates a completed order for a user and book
export async function createOrder(
  userId: string,
  bookId: string,
  overrides: Record<string, any> = {},
) {
  // Generate a unique order number matching the format your checkout controller uses
  // Format: KBS- + timestamp digits — unique per call
  const orderNumber = `KBS-${Date.now()}`;

  const order = await Order.create({
    userId,
    orderNumber,
    items: [
      {
        bookId,
        title: "Test Book",
        author: "Test Author", // Match the Order schema's item snapshot field name
        price: 19.99,
        coverImage: "https://res.cloudinary.com/test/image/upload/cover.jpg",
      },
    ],
    subtotal: 19.99,
    discount: 0,
    total: 19.99,
    paymentStatus: "completed",
    stripeSessionId: `cs_test_${Date.now()}`,
    stripePaymentIntentId: `pi_test_${Date.now()}`,
    completedAt: new Date(),
    ...overrides,
  });

  return order;
}

// COUPON FACTORY

// Creates an active, valid coupon in the database
export async function createCoupon(overrides: Record<string, any> = {}) {
  const coupon = await Coupon.create({
    code: `TEST${Date.now()}`, // Unique code per call
    discountType: "percentage",
    discountValue: 10, // 10% off
    minPurchase: 0, // No minimum purchase required
    validFrom: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started yesterday
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
    usageLimit: 100,
    usedCount: 0,
    isActive: true,
    ...overrides,
  });

  return coupon;
}
