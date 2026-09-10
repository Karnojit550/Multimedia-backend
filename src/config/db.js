const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  // Reuse an existing connection in local and serverless environments.
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Use local MongoDB during development and the configured URI in production.
  const uri = env.nodeEnv === "development"
    ? env.mongoLocalURI
    : env.mongoURI;

  if (!uri) {
    throw new Error("MongoDB URI is not defined in environment variables.");
  }

  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host}`);

  return conn.connection;
};

module.exports = connectDB;
