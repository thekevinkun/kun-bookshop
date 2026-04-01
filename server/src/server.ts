// Import express — the framework that handles all incoming HTTP requests
import express from "express";

// Import dotenv and call config() immediately — this loads our .env file into process.env
// It must be imported FIRST before anything else reads from process.env
import dotenv from "dotenv";
dotenv.config();

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

// Import the auth routes so we can mount them on the Express app
import authRoutes from "./routes/auth.routes";

// Import our logger so we can log server startup messages
import { logger } from "./utils/logger";

// Create the Express application — this is the core of our backend
const app = express();

// Read the port number from .env, or use 5000 as the default if it's not set
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE SETUP ---
// Middleware runs on every request before it reaches our route handlers

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
    origin: process.env.CLIENT_URL || "http://localhost:3000",

    // Allow cookies to be sent with cross-origin requests (needed for our auth cookies)
    credentials: true,
  }),
);

// Mount the auth routes at /api/auth
// Every route inside auth.routes.ts will be prefixed with /api/auth automatically
// e.g. router.post('/login') becomes POST /api/auth/login
app.use("/api/auth", authRoutes);

// --- HEALTH CHECK ROUTE ---
// A simple route to confirm the server is running — used by Docker and monitoring tools
app.get("/api/health", (req, res) => {
  // Respond with a 200 status and a simple message
  res
    .status(200)
    .json({ status: "ok", message: "Kun Bookshop API is running" });
});

// --- START THE SERVER ---
// Define an async function so we can await the database connection before accepting requests
const startServer = async () => {
  // Connect to MongoDB first — if this fails, the app exits (see database.ts)
  await connectDB();

  // Start listening for incoming requests on our chosen port
  app.listen(PORT, () => {
    // Log a message so we know the server is up and ready
    logger.info(
      `Server running on port ${PORT} in ${process.env.NODE_ENV} mode`,
    );
  });
};

// Call the function to kick everything off
startServer();

// Export the app so we can use it in our tests later
export default app;
