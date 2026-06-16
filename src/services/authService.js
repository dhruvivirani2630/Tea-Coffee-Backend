const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const logger = require("../utils/logger");
const { serializeUser } = require("../utils/userSerializer");

const publicUserFields = "-password -__v";

const normalizeOptional = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const sanitizeUser = (user) => {
  const object = user.toObject ? user.toObject() : user;
  delete object.password;
  delete object.__v;
  return object;
};

const resolveLoginQuery = ({ email, phone, identifier }) => {
  const normalizedEmail = normalizeOptional(email)?.toLowerCase();
  const normalizedPhone = normalizeOptional(phone);
  const normalizedIdentifier = normalizeOptional(identifier);

  if (normalizedEmail) {
    return { email: normalizedEmail };
  }

  if (normalizedPhone) {
    return { phone: normalizedPhone };
  }

  if (normalizedIdentifier) {
    if (normalizedIdentifier.includes("@")) {
      return { email: normalizedIdentifier.toLowerCase() };
    }

    return { phone: normalizedIdentifier };
  }

  return null;
};

const registerUser = async ({ name, employeeId, email, phone, password }) => {
  const normalizedEmail = normalizeOptional(email)?.toLowerCase();
  const normalizedPhone = normalizeOptional(phone);

  const existingUser = await User.findOne({
    $or: [
      { employeeId },
      ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
    ],
  });

  if (existingUser) {
    const error = new Error("User with provided employee ID, email, or phone already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    employeeId,
    email: normalizedEmail,
    phone: normalizedPhone,
    password: hashedPassword,
    role: "user",
    status: "active",
  });

  logger.info("New user created successfully", {
    userId: user._id,
    employeeId: user.employeeId,
    email: user.email,
    phone: user.phone,
  });

  const token = generateToken(user);
  return {
    token,
    user: sanitizeUser(user),
  };
};

const loginUser = async (data) => {
  const { email, phone, identifier, password } = data;

  // Validate input
  if (!password) {
    const error = new Error("Password is required");
    error.statusCode = 422;
    throw error;
  }

  let query = {};

  if (email) {
    query.email = email.toLowerCase().trim();
  } else if (phone) {
    query.phone = phone.trim();
  } else if (identifier) {
    query = {
      $or: [
        { email: identifier.toLowerCase().trim() },
        { phone: identifier.trim() },
      ],
    };
  } else {
    const error = new Error("Email, phone, or identifier is required");
    error.statusCode = 422;
    throw error;
  }

  const user = await User.findOne(query).select("+password");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== "active") {
    const error = new Error("Account is inactive");
    error.statusCode = 403;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    const error = new Error("Invalid password");
    error.statusCode = 401;
    throw error;
  }

  user.lastLogin = new Date();
  await user.save();

  return {
    token: generateToken(user),
    user: sanitizeUser(user),
  };
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select(publicUserFields);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return serializeUser(user);
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
