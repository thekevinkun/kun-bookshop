import mongoose from "mongoose";

export async function connectTestDB() {
  // If Mongoose is already connected (readyState 1), skip reconnecting
  // This prevents the "can't call openUri() on an active connection" error
  // when multiple test files share the same Mongoose instance
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI!);
  }
}

export async function disconnectTestDB() {
  await mongoose.disconnect();
}

export async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
