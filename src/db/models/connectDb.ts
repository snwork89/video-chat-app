import mongoose from "mongoose";

const DATABASE_URL = process.env.DATABASE_URL || "";

if (!DATABASE_URL) {
  throw new Error(
    "Please define the DATABASE_URL environment variable inside .env.local"
  );
}

async function connectDB() {
  const opts = {
    bufferCommands: false,
  };
  try{
    await mongoose.connect(DATABASE_URL, opts).then((mongoose) => {
        return mongoose;
      });
  }
  catch(err){
    throw new Error("Database Connection Failed")
  }
}

export default connectDB;
