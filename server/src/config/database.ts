// Import mongoose — this is the library that lets us talk to MongoDB using JavaScript objects
import mongoose from "mongoose";

// Import our logger so we can record what happens during connection (success or failure)
import { logger } from "../utils/logger";

// Define the main function that connects our app to MongoDB
// We mark it as 'async' because connecting to a database takes time and we need to wait for it
const connectDB = async (): Promise<void> => {
  try {
    // Get the MongoDB connection string from our .env file
    // The '!' at the end tells TypeScript "trust me, this value exists"
    const mongoURI = process.env.MONGODB_URI!;

    // Actually connect to MongoDB using the URI
    // Mongoose returns a connection object but we don't need it here, so we just await
    await mongoose.connect(mongoURI);

    // If we reach this line, the connection worked — log it as success
    logger.info("MongoDB connected successfully");
  } catch (error) {
    // If anything goes wrong (wrong URI, DB is down, etc.), log the error
    logger.error("MongoDB connection failed:", error);

    // Exit the entire Node process with code 1 (means "something went wrong")
    // We do this because the app is useless without a database
    process.exit(1);
  }
};

// Export the function so we can call it from server.ts when the app starts
export default connectDB;
