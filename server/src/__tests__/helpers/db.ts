import mongoose from "mongoose";

export async function connectTestDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "";
  if (uri.includes("mongodb.net") || uri.includes("kun-bookshop")) {
    throw new Error(
      "TEST SAFETY: Refusing to connect to a real database in tests!",
    );
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
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
