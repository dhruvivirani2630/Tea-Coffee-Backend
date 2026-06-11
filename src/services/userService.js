const bcrypt = require("bcryptjs");
const User = require("../models/User");

const allowedUserUpdates = ["name", "email", "phone"];
const allowedAdminUpdates = ["name", "email", "phone", "employeeId", "role", "status"];

const normalizePatch = (payload) => {
  const patch = { ...payload };

  if (patch.email === "") {
    delete patch.email;
  } else if (patch.email) {
    patch.email = patch.email.trim().toLowerCase();
  }

  if (patch.phone === "") {
    delete patch.phone;
  } else if (patch.phone) {
    patch.phone = patch.phone.trim();
  }

  return patch;
};

const pickAllowed = (payload, allowedFields) => {
  return Object.keys(payload).reduce((patch, key) => {
    if (allowedFields.includes(key)) {
      patch[key] = payload[key];
    }
    return patch;
  }, {});
};

const buildUserQuery = ({ search, role, status }) => {
  const query = {};

  if (role) {
    query.role = role;
  }

  if (status) {
    query.status = status;
  }

  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [
      { name: regex },
      { employeeId: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  return query;
};

const getUsers = async (filters = {}) => {
  const query = buildUserQuery(filters);
  return User.find(query).sort({ createdAt: -1 });
};

const getUserById = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const updateUser = async ({ targetUserId, actor, payload }) => {
  const isAdmin = actor.role === "admin";
  const isSelf = actor._id.toString() === targetUserId.toString();

  if (!isAdmin && !isSelf) {
    const error = new Error("Users can only update their own profile");
    error.statusCode = 403;
    throw error;
  }

  const allowedFields = isAdmin ? allowedAdminUpdates : allowedUserUpdates;
  const patch = normalizePatch(pickAllowed(payload, allowedFields));

  if (!isAdmin && ("role" in payload || "status" in payload || "employeeId" in payload)) {
    const error = new Error("Users cannot modify role, status, or employee ID");
    error.statusCode = 403;
    throw error;
  }

  if (isSelf && "role" in patch) {
    const error = new Error("Users cannot modify their own role");
    error.statusCode = 403;
    throw error;
  }

  if (patch.role === "admin") {
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin && existingAdmin._id.toString() !== targetUserId.toString()) {
      const error = new Error("Only one admin account is allowed");
      error.statusCode = 409;
      throw error;
    }
  }

  const user = await User.findByIdAndUpdate(targetUserId, patch, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const deleteUser = async ({ targetUserId, actor }) => {
  if (actor._id.toString() === targetUserId.toString()) {
    const error = new Error("Admin cannot delete their own account");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByIdAndDelete(targetUserId);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const updateUserStatus = async ({ targetUserId, status, actor }) => {
  if (actor._id.toString() === targetUserId.toString()) {
    const error = new Error("Admin cannot change their own status");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByIdAndUpdate(
    targetUserId,
    { status },
    { new: true, runValidators: true }
  );

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.password);

  if (!passwordMatches) {
    const error = new Error("Current password is incorrect");
    error.statusCode = 400;
    throw error;
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  return true;
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  changePassword,
};
