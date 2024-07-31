import mongoose from "mongoose";

const DATABASE_URL = process.env.DATABASE_URL || "";
let isConnected = false;
if (!DATABASE_URL) {
  throw new Error(
    "Please define the DATABASE_URL environment variable inside .env.local"
  );
}

async function connectDB() {
  if (isConnected) {
    return;
  }
  const opts = {
    bufferCommands: false,
  };
  try {
    await mongoose.connect(DATABASE_URL, opts);
  } catch (err) {
    throw new Error("Database Connection Failed");
  }
}

export default connectDB;
