const mongoose = require("mongoose");
const env = require("./env");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info("MongoDB connected", { host: mongoose.connection.host });
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);

    if (error.message.includes("whitelist")) {
      logger.error(
        "Atlas blocked this connection. In MongoDB Atlas go to Network Access → Add IP Address → Add Current IP Address (or 0.0.0.0/0 for dev), wait 1-2 minutes, then restart the server."
      );
    }

    process.exit(1);
  }
};

module.exports = connectDB;
