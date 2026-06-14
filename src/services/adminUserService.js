const User = require("../models/User");
const { serializeUser } = require("../utils/userSerializer");
const { buildAllowedPatch, validateProfileImage } = require("./profileService");

const buildQuery = ({ search, role, status, employeeId }) => {
  const query = {};

  if (role) {
    query.role = role;
  }

  if (status) {
    query.status = status;
  }

  if (employeeId) {
    query.employeeId = employeeId;
  }

  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [{ name: regex }, { employeeId: regex }];
  }

  return query;
};

const ensureUniqueUserFields = async ({ email, phone, employeeId, excludeUserId }) => {
  const query = {
    _id: { $ne: excludeUserId },
    $or: [],
  };

  if (email) {
    query.$or.push({ email });
  }

  if (phone) {
    query.$or.push({ phone });
  }

  if (employeeId) {
    query.$or.push({ employeeId });
  }

  if (!query.$or.length) {
    return;
  }

  const existing = await User.findOne(query);

  if (existing) {
    let conflictField = "field";
    if (email && existing.email === email) conflictField = "email";
    if (phone && existing.phone === phone) conflictField = "phone";
    if (employeeId && existing.employeeId === employeeId) conflictField = "employeeId";

    const error = new Error(`${conflictField} already exists`);
    error.statusCode = 409;
    throw error;
  }
};

const getUsers = async (filters = {}) => {
  const query = buildQuery(filters);
  const users = await User.find(query).sort({ createdAt: -1 });
  return users.map((user) => serializeUser(user));
};

const getUserById = async (id) => {
  const user = await User.findById(id).select("-password -__v");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return serializeUser(user);
};

const updateUser = async ({ targetUserId, payload, actor }) => {
  const user = await User.findById(targetUserId).select("-password -__v");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const patch = buildAllowedPatch(payload, [
    "name",
    "email",
    "phone",
    "employeeId",
    "role",
    "status",
    "profileImage",
  ]);

  if (patch.profileImage) {
    validateProfileImage(patch.profileImage);
  }

  await ensureUniqueUserFields({
    email: patch.email,
    phone: patch.phone,
    employeeId: patch.employeeId,
    excludeUserId: targetUserId,
  });

  user.set(patch);
  user.updatedBy = actor._id;
  await user.save();

  return serializeUser(user);
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
};
