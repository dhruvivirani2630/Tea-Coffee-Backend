const User = require("../models/User");
const { serializeUser } = require("../utils/userSerializer");
const { buildAllowedPatch, validateProfileImage } = require("./profileService");

const buildQuery = ({ search, role, status, employeeId, excludeUserId }) => {
  const query = {};

  // Exclude the admin's own entry
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }

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
  const { page = 1, limit = 10, ...filterParams } = filters;
  
  // Validate pagination parameters
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max limit is 100
  const skip = (pageNum - 1) * limitNum;

  const query = buildQuery(filterParams);
  
  // Get total count for pagination
  const total = await User.countDocuments(query);
  
  // Get paginated users
  const users = await User.find(query)
    .select("-password -__v")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);
  
  return {
    users: users.map((user) => serializeUser(user)),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
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
