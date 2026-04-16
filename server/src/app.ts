// Import express — the framework that handles all incoming HTTP requests
import express from "express";

// Load and validate environment variables before other modules read them
import { env } from "./config/env";

// Import cors — this controls which websites are allowed to talk to our API
import cors from "cors";

// Import helmet — this automatically sets secure HTTP headers to protect against common attacks
import helmet from "helmet";

// Import cookie-parser — this lets us read cookies from incoming requests (we use cookies for auth tokens)
import cookieParser from "cookie-parser";

// Import morgan — this logs every incoming HTTP request to the terminal (method, URL, status code)
import morgan from "morgan";

// Import compression — this shrinks the size of responses sent to the client (faster load times)
import compression from "compression";

// Import our database connection function
import connectDB from "./config/database";

// Import the stale order expiry job — runs on startup and every hour
import { expireStaleOrders } from "./jobs/expireOrders";

// Sitemap route
import sitemapRouter from "./routes/sitemap.routes";

// Import the auth routes so we can mount them on the Express app
import authRoutes from "./routes/auth.routes";

// Import the book routes here so we can mount them on the Express app
import bookRoutes from "./routes/book.routes";

// Import the author router — handles all /api/authors/* endpoints
import authorRoutes from "./routes/author.routes";

// Import the review router — handles all /api/reviews/* endpoints
import reviewRoutes from "./routes/review.routes";

// Import User-scoped orders route
import ordersRoutes from "./routes/orders.routes";

import couponRoutes from "./routes/coupon.routes";

// Import the checkout and webhook routes so we can mount them on the Express app
import checkoutRoutes from "./routes/checkout.routes";
import webhookRoutes from "./routes/webhook.routes";

// Import the downloads router to handle secure book download URL generation
import downloadsRoutes from "./routes/downloads.routes";

// Import the users router to handle library and wishlist endpoints
import usersRoutes from "./routes/users.routes";

// Import the admin router — handles all /api/admin/* endpoints
import adminRoutes from "./routes/admin.routes";

// Import Apollo Server and the Express middleware adapter for Apollo
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";

// Import our GraphQL type definitions and resolvers
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";

import { createContext } from "./graphql/context";

// Create the Express application — this is the core of our backend
const app = express();

// MIDDLEWARE SETUP
// Middleware runs on every request before it reaches our route handlers

// Register sitemap at /sitemap.xml
// This must be registered early — no auth, no body parsing needed
app.use("/sitemap.xml", sitemapRouter);

// IMPORTANT: Webhook route must be registered BEFORE express.json() middleware
// so the raw body is preserved for Stripe signature verification
// In your server.ts, make sure webhooks is above app.use(express.json(...))
app.use("/api/webhooks", webhookRoutes);

// Tell Express to parse incoming JSON request bodies (e.g., login form data)
// Limit to 10kb to prevent attackers from sending huge payloads that could crash the server
app.use(express.json({ limit: "10kb" }));

// Tell Express to also parse URL-encoded form data (same 10kb size limit)
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Apply helmet to set secure headers on every response automatically
app.use(helmet());

// Apply compression to shrink response sizes — saves bandwidth for our users
app.use(compression());

// Apply cookie-parser so we can read httpOnly cookies (where we store JWT tokens)
app.use(cookieParser());

// Apply morgan to log every request in 'dev' format (colored, concise output)
// We only do this in development — in production we use our Winston logger instead
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Configure CORS — tell the browser which frontend URL is allowed to make requests
app.use(
  cors({
    // Only allow requests from our React frontend URL (set in .env)
    origin: env.CLIENT_URL,

    // Allow cookies to be sent with cross-origin requests (needed for our auth cookies)
    credentials: true,
  }),
);

// Mount the auth routes at /api/auth
// Every route inside auth.routes.ts will be prefixed with /api/auth automatically
// e.g. router.post('/login') becomes POST /api/auth/login
app.use("/api/auth", authRoutes);

// Mount the admin router — all paths here start with /api/admin
// authenticate + isAdmin inside the router handles all access control
app.use("/api/admin", adminRoutes);

// add this line after app.use('/api/auth', authRoutes)
app.use("/api/books", bookRoutes);

// Mount the author router — all paths start with /api/authors
app.use("/api/authors", authorRoutes);

// Checkout route goes with the other API routes (after express.json())
app.use("/api/checkout", checkoutRoutes);

// Register the downloads routes — handles /api/downloads/book/:bookId and /api/downloads/history
app.use("/api/downloads", downloadsRoutes);

// Register the users routes — handles /api/users/library and /api/users/wishlist
app.use("/api/users", usersRoutes);

// Mount the review router — all paths start with /api/reviews
app.use("/api/reviews", reviewRoutes);

// User's own order history
app.use("/api/orders", ordersRoutes);

// Coupon for user and admin
app.use("/api/coupons", couponRoutes);
app.use("/api/admin/coupons", couponRoutes);

// HEALTH CHECK ROUTE
// A simple route to confirm the server is running — used by Docker and monitoring tools
app.get("/api/health", (req, res) => {
  // Respond with a 200 status and a simple message
  res
    .status(200)
    .json({ status: "ok", message: "Kun Bookshop API is running" });
});

// START THE SERVER
// Define an async function so we can await the database connection before accepting requests
const startServer = async () => {
  // Connect to MongoDB first — if this fails, the app exits (see database.ts)
  await connectDB();

  // Run the stale order cleanup once on startup — catches anything that expired
  // while the server was down (e.g. overnight, after a deploy)
  await expireStaleOrders();

  // Then schedule it to run every hour going forward
  // 60 * 60 * 1000 = 3,600,000 ms = 1 hour
  setInterval(expireStaleOrders, 60 * 60 * 1000);

  // Start the Apollo Server so it's ready to handle GraphQL requests
  const apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();

  // Then register GraphQL middleware
  app.use(
    "/graphql",
    expressMiddleware(apolloServer, {
      context: createContext,
    }),
  );
};

// Call the function to kick everything off
startServer();

export default app;
