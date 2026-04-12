// Minimal seed — only creates the three user accounts needed for E2E tests
// Run with: npm run seed:users
// Safe to run multiple times — deletes existing users first

import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Load .env so we get the real MONGODB_URI
dotenv.config();

import { User } from "./models/User";

const uri = process.env.MONGODB_URI || "";
if (!uri) {
  console.error("❌ MONGODB_URI is not set in .env");
  process.exit(1);
}

async function main() {
  try {
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    // Only wipe users — leaves your books, authors, orders, coupons untouched
    await User.deleteMany({});
    console.log("🗑  Cleared users collection");

    const adminPassword = await bcrypt.hash("AdminPass123!", 10);
    const userPassword = await bcrypt.hash("UserPass123!", 10);
    const e2ePassword = await bcrypt.hash("E2ePassword123!", 10);

    // Grab any existing book IDs from your real data to populate the library
    // This way the E2E user actually has something in their library page
    const { Book } = await import("./models/Book");
    const anyBooks = await Book.find({ isActive: true }).limit(2).select("_id");
    const libraryBookIds = anyBooks.map((b) => b._id);

    await User.insertMany([
      {
        email: "admin@kunbookshop.com",
        password: adminPassword,
        firstName: "Kevin",
        lastName: "Admin",
        role: "admin",
        isVerified: true,
        failedLoginAttempts: 0,
        library: [],
        wishlist: [],
        emailPreferences: {
          marketing: true,
          orderUpdates: true,
          newReleases: true,
          priceDrops: true,
        },
      },
      {
        email: "user@kunbookshop.com",
        password: userPassword,
        firstName: "Regular",
        lastName: "User",
        role: "user",
        isVerified: true,
        failedLoginAttempts: 0,
        library: libraryBookIds,
        wishlist: [],
        emailPreferences: {
          marketing: false,
          orderUpdates: true,
          newReleases: true,
          priceDrops: false,
        },
      },
      {
        // Must match TEST_USER in client/e2e/helpers.ts exactly
        email: "e2e@example.com",
        password: e2ePassword,
        firstName: "E2E",
        lastName: "Tester",
        role: "user",
        isVerified: true,
        failedLoginAttempts: 0,
        library: libraryBookIds, // Give them real books so /library page is populated
        wishlist: [],
        emailPreferences: {
          marketing: false,
          orderUpdates: true,
          newReleases: false,
          priceDrops: false,
        },
      },
    ]);

    console.log("\n🎉 Users seeded! Log in with:");
    console.log("   Admin → admin@kunbookshop.com / AdminPass123!");
    console.log("   User  → user@kunbookshop.com  / UserPass123!");
    console.log("   E2E   → e2e@example.com        / E2ePassword123!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  }
}

main();
