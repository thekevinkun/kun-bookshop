// This file runs ONCE before all test suites (globalSetup)
// It starts an in-memory MongoDB server so our tests never touch the real database
import { MongoMemoryServer } from "mongodb-memory-server";

// We store the server instance here so we can stop it after all tests finish
let mongoServer: MongoMemoryServer;

// globalSetup must export a `setup` function — Vitest calls it automatically
export async function setup() {
  // Start an in-memory MongoDB instance — no real MongoDB needed
  // mongodb-memory-server downloads a MongoDB binary on first run (cached after that)
  mongoServer = await MongoMemoryServer.create();

  // Get the connection URI for this in-memory instance (e.g., mongodb://127.0.0.1:PORT/test)
  const mongoUri = mongoServer.getUri();

  // Inject the URI into the process environment so our app's connectDB() picks it up
  // This overrides MONGO_URI from .env — tests always use the in-memory DB
  process.env.MONGO_URI = mongoUri;

  // Set other required env vars so our app doesn't crash during tests
  process.env.JWT_SECRET =
    "test-jwt-secret-that-is-at-least-64-characters-long-for-testing-purposes-only";
  process.env.REFRESH_TOKEN_SECRET =
    "test-refresh-secret-also-long-enough-for-testing-purposes-only-here";
  process.env.NODE_ENV = "test";
  process.env.CLIENT_URL = "http://localhost:3000";
  process.env.CLOUDINARY_CLOUD_NAME = "test";
  process.env.CLOUDINARY_API_KEY = "test";
  process.env.CLOUDINARY_API_SECRET = "test";
  process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_placeholder";
}

// globalSetup must export a `teardown` function — Vitest calls it after all tests finish
export async function teardown() {
  // Stop the in-memory MongoDB server and free the port
  await mongoServer.stop();
}
