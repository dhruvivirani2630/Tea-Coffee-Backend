require("../config/env");

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const logger = require("../utils/logger");

const adminData = {
  employeeId: process.env.ADMIN_EMPLOYEE_ID || "ADMIN001",
  name: process.env.ADMIN_NAME || "System Admin",
  email: process.env.ADMIN_EMAIL || "admin@example.com",
  password: process.env.ADMIN_PASSWORD || "Admin@123",
};

const createAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      logger.info("Admin account already exists. Skipping creation.");
      return;
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    await User.create({
      employeeId: adminData.employeeId,
      name: adminData.name,
      email: adminData.email,
      password: hashedPassword,
      role: "admin",
      status: "active",
    });

    logger.info("Admin account created successfully.");
  } catch (error) {
    logger.error(`Admin seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

createAdmin();
