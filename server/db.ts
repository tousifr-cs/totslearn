import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error(
    "MONGODB_URI must be set. Did you forget to provision a database?",
  );
}

export async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Connected to MongoDB");
}

export { mongoose };
