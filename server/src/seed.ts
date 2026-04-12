// This script populates the kun-bookshop database with realistic development data
// Run it with: npx tsx src/seed.ts
// It is safe to run multiple times — it clears existing data first

import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Load environment variables from .env so we get the real MONGODB_URI
dotenv.config();

// Import all models so Mongoose registers their schemas
import { User } from "./models/User";
import { Book } from "./models/Book";
import { Author } from "./models/Author";
import { Order } from "./models/Order";
import { Review } from "./models/Review";
import { Coupon } from "./models/Coupon";

// Safety guard
// Refuse to run if the URI looks like a test/memory server
// This mirrors the guard in our test helpers to prevent accidents
const uri = process.env.MONGODB_URI || "";
if (!uri) {
  console.error("❌ MONGODB_URI is not set in .env");
  process.exit(1);
}
if (uri.includes("127.0.0.1") && process.env.NODE_ENV === "test") {
  console.error("❌ Refusing to seed — looks like a test database URI");
  process.exit(1);
}

// Connect
async function connect() {
  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB:", uri.split("@").pop()); // Never log credentials
}

// Clear all collections
// We wipe first so the seed is idempotent — safe to run multiple times
async function clearAll() {
  await Promise.all([
    User.deleteMany({}),
    Book.deleteMany({}),
    Author.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    Coupon.deleteMany({}),
  ]);
  console.log("🗑  Cleared all collections");
}

// Seed authors
async function seedAuthors() {
  // These authors match the PLACEHOLDER_AUTHORS used in Phase 3
  // Using real-looking data makes the UI look polished during demos
  const authors = await Author.insertMany([
    {
      name: "Arundhati Roy",
      bio: `Suzanna Arundhati Roy is an Indian author best known for her novel The God of Small Things, which won the Booker Prize for Fiction in 1997 and became the biggest-selling book by a non-expatriate Indian author. She is also a political activist involved in human rights and environmental causes. She was the winner of the 2024 PEN Pinter Prize, given by English PEN,[7] and she named imprisoned British-Egyptian writer and activist Alaa Abd El-Fattah as the "Writer of Courage" with whom she chose to share the award.`,
      avatar:
        "https://res.cloudinary.com/ddvmmonre/image/upload/v1775616194/kun-bookshop/authors/kpxd9tusxcbsu9c6e1sz.jpg",
      avatarPublicId: "kun-bookshop/authors/kpxd9tusxcbsu9c6e1sz.jpg",
      specialty: ["Literary Fiction", "Political", "Memoir"],
      nationality: "Indian",
      website: null,
      socialLinks: {
        twitter: null,
        linkedin: null,
        facebook: null,
        instagram: null,
      },
      isActive: true,
    },
    {
      name: "Yuval Noah Harari",
      bio: "Yuval Noah Harari is an Israeli medievalist, military historian, public intellectual, and popular science writer. He is a professor of history at the Hebrew University of Jerusalem. His first bestselling book, Sapiens: A Brief History of Humankind is based on his lectures to an undergraduate world history class. His first bestselling book, Sapiens: A Brief History of Humankind (2011) is based on his lectures to an undergraduate world history class. His other works include the bestsellers Homo Deus: A Brief History of Tomorrow (2016), 21 Lessons for the 21st Century (2018), and Nexus: A Brief History of Information Networks from the Stone Age to AI (2024). His published work examines themes of free will, consciousness, intelligence, happiness, suffering and the role of storytelling in human evolution.",
      avatar:
        "https://res.cloudinary.com/ddvmmonre/image/upload/v1775614733/kun-bookshop/authors/csraapt33rduktyqm2qq.jpg",
      avatarPublicId: "kun-bookshop/authors/csraapt33rduktyqm2qq.jpg",
      specialty: ["History", "Science", "Popular Science", "Philosophy"],
      nationality: "Israeli",
      website: "https://www.ynharari.com/",
      socialLinks: {
        twitter: "https://x.com/harari_yuval",
        linkedin: null,
        facebook: "https://www.facebook.com/Prof.Yuval.Noah.Harari/",
        instagram: "https://www.instagram.com/yuval_noah_harari/",
      },
      isActive: true,
    },
    {
      name: "Fyodor Dostoevsky",
      bio: "Fyodor Mikhailovich Dostoevsky was a Russian philosopher, novelist, short story writer, essayist and journalist. He is regarded as one of the greatest novelists in both Russian and world literature, and many of his works are considered highly influential masterpieces. His most acclaimed novels include Crime and Punishment (1866), The Idiot (1869), Demons (1872), The Adolescent (1875) and The Brothers Karamazov (1880). His Notes from Underground, a novella published in 1864, is considered one of the first works of existentialist literature.",
      avatar:
        "https://res.cloudinary.com/ddvmmonre/image/upload/v1775614442/kun-bookshop/authors/bstsr6jwedmhtx5fy41r.jpg",
      avatarPublicId: "kun-bookshop/authors/bstsr6jwedmhtx5fy41r.jpg",
      specialty: ["Psychological Fiction", "Philosophical Fiction", "Literary Criticism"],
      nationality: "Russian",
      website: "https://www.fyodordostoevsky.com/",
      socialLinks: {
        twitter: null,
        linkedin: null,
        facebook: null,
        instagram: null,
      },
      isActive: true,
    },
    {
      name: "James Clear",
      bio: "James Clear is a writer and speaker. He is the author of the #1 New York Times bestseller Atomic Habits and the popular 3-2-1 newsletter. He has sold more than 25 million copies worldwide and has been translated into more than 60 languages.",
      avatar:
        "https://res.cloudinary.com/ddvmmonre/image/upload/v1775609386/kun-bookshop/authors/zvt07sgts7qgbitxprph.jpg",
      avatarPublicId: "kun-bookshop/authors/zvt07sgts7qgbitxprph",
      specialty: ["Self-Help", "Personal Development", "Productivity"],
      nationality: "American",
      website: "https://jamesclear.com",
      socialLinks: {
        twitter: "https://x.com/JamesClear",
        linkedin: null,
        facebook: "https://www.facebook.com/jamesclear/",
        instagram: "https://www.instagram.com/jamesclear/",
      },
      isActive: true,
    },
    {
      name: "Mark Manson",
      bio: `Mark Manson is a #1 New York Times bestselling author and blogger known for his counterintuitive, "non-bullshitty" self-help advice. He advocates for accepting negative emotions, embracing inevitable struggles, and focusing on, rather than avoiding, life's problems. His work challenges positive thinking, urging readers to choose better values and meaningful struggles. He's the three-time #1 New York Times bestselling author of The Subtle Art of Not Giving a F*ck, as well as other titles. His books have sold over 20 million copies, been translated into more than 65 languages, and reached number one in more than a dozen countries. In 2023, a feature film about his life and ideas was released worldwide by Universal Pictures.`,
      avatar:
        "https://res.cloudinary.com/ddvmmonre/image/upload/v1775533609/kun-bookshop/authors/f3hlmaolazsdibweytqd.jpg",
      avatarPublicId: "kun-bookshop/authors/f3hlmaolazsdibweytqd",
      specialty: ["Self-Help", "Personal Development", "Psychology", "Productivity"],
      nationality: "American",
      website: "https://markmanson.net/",
      socialLinks: {
        twitter: "https://x.com/Markmanson",
        linkedin: "linkedin.com/in/markmanson",
        facebook: "https://www.facebook.com/Markmansonnet",
        instagram: "https://www.instagram.com/markmanson",
      },
      isActive: true,
    },
  ]);

  console.log(`✅ Seeded ${authors.length} authors`);
  return authors;
}

// Seed books
async function seedBooks(authors: mongoose.Document[]) {
  // author field is always an ObjectId — authorName is the denormalized display string
  // Both are required on every book document
  const books = await Book.insertMany([
    {
      title: "Clean Code: A Handbook of Agile Software Craftsmanship",
      author: authors[0]._id, // Robert C. Martin
      authorName: "Robert C. Martin", // Denormalized — used in list views without populate
      description:
        "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. But it doesn't have to be that way. This book is a must for any developer, software engineer, project manager, team lead, or systems analyst with an interest in producing better code.",
      price: 39.99,
      discountPrice: 29.99,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/41xShlnTZTL._SX376_BO1,204,203,200_.jpg",
      fileUrl:
        "https://res.cloudinary.com/demo/raw/upload/v1/books/clean-code.pdf",
      fileType: "pdf",
      fileSize: 4200000,
      isbn: "978-0132350884",
      publisher: "Prentice Hall",
      category: ["Programming", "Software Engineering"],
      tags: ["bestseller", "clean code", "agile"],
      rating: 4.7,
      reviewCount: 245,
      purchaseCount: 1820,
      isFeatured: true,
      isActive: true,
      previewPages: 30,
      videoUrl: "https://www.youtube.com/embed/7EmboKQH8lM",
      filePublicId: "books/clean-code",
      coverPublicId: "covers/clean-code",
    },
    {
      title: "The Pragmatic Programmer: Your Journey to Mastery",
      author: authors[1]._id, // Andrew Hunt
      authorName: "Andrew Hunt",
      description:
        "This book examines the core process of writing robust, adaptable, maintainable code, and explores the best approaches for software development from a career-long perspective. Whether you're new to the field or an experienced practitioner, you'll come away with fresh insights and ideas.",
      price: 44.99,
      discountPrice: undefined,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/41as+WafrFL._SX376_BO1,204,203,200_.jpg",
      fileUrl:
        "https://res.cloudinary.com/demo/raw/upload/v1/books/pragmatic-programmer.pdf",
      fileType: "pdf",
      fileSize: 5100000,
      isbn: "978-0135957059",
      publisher: "Addison-Wesley",
      category: ["Programming", "Career"],
      tags: ["pragmatic", "career", "must-read"],
      rating: 4.8,
      reviewCount: 312,
      purchaseCount: 2100,
      isFeatured: true,
      isActive: true,
      previewPages: 25,
      videoUrl: null,
      filePublicId: "books/pragmatic-programmer",
      coverPublicId: "covers/pragmatic-programmer",
    },
    {
      title: "Refactoring: Improving the Design of Existing Code",
      author: authors[2]._id, // Martin Fowler
      authorName: "Martin Fowler",
      description:
        "For more than twenty years, experienced programmers worldwide have relied on Martin Fowler's Refactoring to improve the design of existing code and to enhance software maintainability, as well as to make existing code easier to understand.",
      price: 49.99,
      discountPrice: 34.99,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/41LBzpPXCOL._SX376_BO1,204,203,200_.jpg",
      fileUrl:
        "https://res.cloudinary.com/demo/raw/upload/v1/books/refactoring.pdf",
      fileType: "pdf",
      fileSize: 6800000,
      isbn: "978-0134757599",
      publisher: "Addison-Wesley",
      category: ["Programming", "Software Engineering"],
      tags: ["refactoring", "design", "patterns"],
      rating: 4.6,
      reviewCount: 189,
      purchaseCount: 1340,
      isFeatured: true,
      isActive: true,
      previewPages: 20,
      videoUrl: null,
      filePublicId: "books/refactoring",
      coverPublicId: "covers/refactoring",
    },
    {
      title:
        "Domain-Driven Design: Tackling Complexity in the Heart of Software",
      author: authors[3]._id, // Eric Evans
      authorName: "Eric Evans",
      description:
        "The software development community widely acknowledges that domain modeling is central to software design. Through the course of this book, Eric Evans demonstrates a systematic approach to domain-driven design, including the building blocks of a model-driven design.",
      price: 54.99,
      discountPrice: undefined,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/51sZW87slRL._SX376_BO1,204,203,200_.jpg",
      fileUrl:
        "https://res.cloudinary.com/demo/raw/upload/v1/books/domain-driven-design.pdf",
      fileType: "pdf",
      fileSize: 7200000,
      isbn: "978-0321125217",
      publisher: "Addison-Wesley",
      category: ["Software Architecture", "Programming"],
      tags: ["DDD", "architecture", "advanced"],
      rating: 4.5,
      reviewCount: 156,
      purchaseCount: 980,
      isFeatured: false,
      isActive: true,
      previewPages: 15,
      videoUrl: null,
      filePublicId: "books/ddd",
      coverPublicId: "covers/ddd",
    },
    {
      title: "Practical Object-Oriented Design: An Agile Primer Using Ruby",
      author: authors[4]._id, // Sandi Metz
      authorName: "Sandi Metz",
      description:
        "Practical Object-Oriented Design using Ruby (POODR) is a guide to writing maintainable, flexible, and pleasing object-oriented code. Written in a clear, approachable style, this book covers everything from basic OOP principles to advanced design patterns.",
      price: 34.99,
      discountPrice: 24.99,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/41f5M2V7xTL._SX376_BO1,204,203,200_.jpg",
      fileUrl: "https://res.cloudinary.com/demo/raw/upload/v1/books/poodr.epub",
      fileType: "epub",
      fileSize: 3100000,
      isbn: "978-0134456478",
      publisher: "Addison-Wesley",
      category: ["Programming", "Object-Oriented"],
      tags: ["OOP", "Ruby", "design"],
      rating: 4.9,
      reviewCount: 203,
      purchaseCount: 1560,
      isFeatured: true,
      isActive: true,
      previewPages: 20,
      videoUrl: null,
      filePublicId: "books/poodr",
      coverPublicId: "covers/poodr",
    },
    {
      title:
        "Clean Architecture: A Craftsman's Guide to Software Structure and Design",
      author: authors[0]._id, // Robert C. Martin
      authorName: "Robert C. Martin",
      description:
        "Building upon the success of best-sellers The Clean Coder and Clean Code, legendary software craftsman Robert C. Martin shows how to bring greater professionalism and discipline to application architecture and design.",
      price: 44.99,
      discountPrice: 32.99,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/41BjtnvIUQL._SX376_BO1,204,203,200_.jpg",
      fileUrl:
        "https://res.cloudinary.com/demo/raw/upload/v1/books/clean-architecture.pdf",
      fileType: "pdf",
      fileSize: 5500000,
      isbn: "978-0134494166",
      publisher: "Prentice Hall",
      category: ["Software Architecture", "Programming"],
      tags: ["architecture", "clean code", "design"],
      rating: 4.6,
      reviewCount: 178,
      purchaseCount: 1240,
      isFeatured: false,
      isActive: true,
      previewPages: 25,
      videoUrl: null,
      filePublicId: "books/clean-architecture",
      coverPublicId: "covers/clean-architecture",
    },
    {
      title: "Patterns of Enterprise Application Architecture",
      author: authors[2]._id, // Martin Fowler
      authorName: "Martin Fowler",
      description:
        "This book is an invaluable catalog of 40 patterns that describe the problems that occur repeatedly in enterprise application development, and provides a way to solve those problems.",
      price: 59.99,
      discountPrice: undefined,
      coverImage:
        "https://images-na.ssl-images-amazon.com/images/I/51IuDvEFtXL._SX376_BO1,204,203,200_.jpg",
      fileUrl: "https://res.cloudinary.com/demo/raw/upload/v1/books/peaa.pdf",
      fileType: "pdf",
      fileSize: 8900000,
      isbn: "978-0321127426",
      publisher: "Addison-Wesley",
      category: ["Software Architecture", "Enterprise"],
      tags: ["patterns", "enterprise", "advanced"],
      rating: 4.4,
      reviewCount: 134,
      purchaseCount: 760,
      isFeatured: false,
      isActive: true,
      previewPages: 10,
      videoUrl: null,
      filePublicId: "books/peaa",
      coverPublicId: "covers/peaa",
    },
    {
      title: "The God of Small Things",
      author: authors[0]._id,
      authorName: "Arundhati Roy",
      description:
        "In The Clean Coder, legendary software expert Robert C. Martin introduces the disciplines, techniques, tools, and practices of true software craftsmanship. This book is packed with practical advice—about everything from estimating and coding to refactoring and testing.",
      price: 34.99,
      discountPrice: 24.99,
      coverImage:
        "https://res.cloudinary.com/ddvmmonre/image/upload/v1775618824/kun-bookshop/covers/mytfgyna6yl8o0lggxzp.jpg",
      fileUrl:
        "https://res.cloudinary.com/ddvmmonre/raw/upload/v1775618825/kun-bookshop/books/vv5hxvkmob41oupnmtiv",
      fileType: "pdf",
      fileSize: 3800000,
      isbn: "978-0812979657",
      publisher: "Random House Trade Paperbacks",
      category: ["Programming", "Career"],
      tags: ["professionalism", "career", "clean code"],
      rating: 4.5,
      reviewCount: 167,
      purchaseCount: 1100,
      isFeatured: false,
      isActive: true,
      previewPages: 20,
      videoUrl: null,
      filePublicId: "kun-bookshop/books/vv5hxvkmob41oupnmtiv",
      coverPublicId: "kun-bookshop/covers/mytfgyna6yl8o0lggxzp.jpg",
    },
  ]);

  console.log(`✅ Seeded ${books.length} books`);
  return books;
}

// Seed users
async function seedUsers(books: mongoose.Document[]) {
  // Hash passwords — bcrypt with 10 rounds matches our auth controller
  const adminPassword = await bcrypt.hash("Adminkun123", 10);
  const e2ePassword = await bcrypt.hash("E2ePassword123!", 10);

  const users = await User.insertMany([
    {
      // Admin account — full access to the dashboard
      email: "admin@kunbookshop.com",
      password: adminPassword,
      firstName: "Paco",
      lastName: "Admin",
      role: "admin",
      isVerified: true, // Verified so they can log in immediately
      failedLoginAttempts: 0,
      library: [], // Admins don't need purchased books
      wishlist: [],
      emailPreferences: {
        marketing: true,
        orderUpdates: true,
        newReleases: true,
        priceDrops: true,
      },
    },
    {
      // E2E test account — Playwright uses these exact credentials
      // Must match TEST_USER in client/e2e/helpers.ts exactly
      email: "e2e@example.com",
      password: e2ePassword,
      firstName: "E2E",
      lastName: "Tester",
      role: "user",
      isVerified: true, // Must be verified or login will fail
      failedLoginAttempts: 0,
      // Give the E2E user a purchased book so the library E2E test passes
      library: [],
      wishlist: [],
      emailPreferences: {
        marketing: false,
        orderUpdates: true,
        newReleases: false,
        priceDrops: false,
      },
    },
  ]);

  console.log(`✅ Seeded ${users.length} users`);
  return users;
}

// Seed orders
async function seedOrders(
  users: mongoose.Document[],
  books: mongoose.Document[],
) {
  // Create a completed order for the regular user so the order history page works
  // The order snapshot stores title/authorName at purchase time
  const regularUser = users[1]; // user@kunbookshop.com
  const book1 = books[0] as any;
  const book2 = books[1] as any;

  const orders = await Order.insertMany([
    {
      // Order for the regular user — already completed
      orderNumber: "ORD-20241205-ABC123",
      userId: regularUser._id,
      items: [
        {
          bookId: book1._id,
          title: book1.title,
          author: book1.authorName, // snapshot uses authorName (string) not ObjectId
          price: book1.discountPrice || book1.price,
          coverImage: book1.coverImage,
        },
        {
          bookId: book2._id,
          title: book2.title,
          author: book2.authorName,
          price: book2.discountPrice || book2.price,
          coverImage: book2.coverImage,
        },
      ],
      subtotal: 59.98, // 29.99 + 44.99 (after discounts)
      discount: 0,
      total: 59.98,
      paymentStatus: "completed",
      paymentMethod: "stripe",
      stripePaymentIntentId: "pi_seed_test_001",
      stripeSessionId: "cs_seed_test_001",
      completedAt: new Date("2024-12-05T10:30:00Z"),
    },
    {
      // Order for the E2E user — completed, gives them their library book
      orderNumber: "ORD-20241206-E2E001",
      userId: users[2]._id, // e2e@example.com
      items: [
        {
          bookId: book1._id,
          title: book1.title,
          author: book1.authorName,
          price: book1.discountPrice || book1.price,
          coverImage: book1.coverImage,
        },
      ],
      subtotal: 29.99,
      discount: 0,
      total: 29.99,
      paymentStatus: "completed",
      paymentMethod: "stripe",
      stripePaymentIntentId: "pi_seed_test_e2e",
      stripeSessionId: "cs_seed_test_e2e",
      completedAt: new Date("2024-12-06T09:00:00Z"),
    },
  ]);

  console.log(`✅ Seeded ${orders.length} orders`);
  return orders;
}

// Seed reviews
async function seedReviews(
  users: mongoose.Document[],
  books: mongoose.Document[],
) {
  const regularUser = users[1]; // user@kunbookshop.com

  const reviews = await Review.insertMany([
    {
      bookId: books[0]._id, // Clean Code
      userId: regularUser._id,
      rating: 5,
      comment:
        "This book completely changed how I write code. Every professional developer should read it at least once. The principles are timeless and the examples are clear.",
      isPurchaseVerified: true, // This user has the book in their library
      helpfulCount: 12,
      helpfulVoters: [],
      isActive: true,
    },
    {
      bookId: books[1]._id, // The Pragmatic Programmer
      userId: regularUser._id,
      rating: 5,
      comment:
        "An absolute classic. The advice is practical and immediately applicable to real-world projects. I reference this book constantly.",
      isPurchaseVerified: true,
      helpfulCount: 8,
      helpfulVoters: [],
      isActive: true,
    },
  ]);

  console.log(`✅ Seeded ${reviews.length} reviews`);
  return reviews;
}

// Seed coupons
async function seedCoupons() {
  const now = new Date();
  const nextYear = new Date(
    now.getFullYear() + 1,
    now.getMonth(),
    now.getDate(),
  );
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const coupons = await Coupon.insertMany([
    {
      // Active percentage coupon — works right now, good for testing
      code: "SAVE20",
      discountType: "percentage",
      discountValue: 20, // 20% off
      minPurchase: 20, // Must spend at least $20
      maxDiscount: 30, // Cap savings at $30
      validFrom: lastWeek, // Already started
      validUntil: nextYear, // Expires next year
      usageLimit: 100,
      usedCount: 5,
      isActive: true,
    },
    {
      // Active fixed-amount coupon
      code: "LAUNCH10",
      discountType: "fixed",
      discountValue: 10, // $10 off flat
      minPurchase: 30, // Must spend at least $30
      maxDiscount: undefined, // No cap needed for fixed discounts
      validFrom: lastWeek,
      validUntil: nextYear,
      usageLimit: 50,
      usedCount: 2,
      isActive: true,
    },
    {
      // Expired coupon — useful for testing the "expired coupon" error path
      code: "EXPIRED50",
      discountType: "percentage",
      discountValue: 50,
      minPurchase: 0,
      validFrom: new Date("2024-01-01"),
      validUntil: new Date("2024-06-01"), // Already expired
      usageLimit: 100,
      usedCount: 10,
      isActive: true, // isActive=true but validUntil is past — backend catches this
    },
    {
      // Inactive coupon — tests the "inactive coupon" error path
      code: "DISABLED",
      discountType: "fixed",
      discountValue: 15,
      minPurchase: 0,
      validFrom: lastWeek,
      validUntil: nextYear,
      usageLimit: 100,
      usedCount: 0,
      isActive: false, // Admin deactivated this one
    },
  ]);

  console.log(`✅ Seeded ${coupons.length} coupons`);
  return coupons;
}

// Main
async function main() {
  try {
    await connect();
    await clearAll();

    // Order matters — books need authors, orders need users + books, reviews need users + books
    const authors = await seedAuthors();
    // const books = await seedBooks(authors);
    // const users = await seedUsers([]);
    // await seedOrders(users, books);
    // await seedReviews(users, books);
    // await seedCoupons();

    console.log("\n🎉 Seed complete! You can now log in with:");
    console.log("   Admin  → admin@kunbookshop.com / Adminkun123!");
    console.log("   E2E    → e2e@example.com        / E2ePassword123!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    // Always disconnect cleanly — don't leave the process hanging
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

main();
