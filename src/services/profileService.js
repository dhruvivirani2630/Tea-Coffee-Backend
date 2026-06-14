const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { serializeUser } = require("../utils/userSerializer");

const IMAGE_DATA_URI_REGEX = /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=\r\n]+$/i;
const IMAGE_URL_REGEX = /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const normalizeString = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const normalizeProfileImage = (value) => {
  const image = normalizeString(value);

  if (!image) {
    return undefined;
  }

  return image;
};

const validateProfileImage = (value) => {
  if (!value) {
    return true;
  }

  const isDataUri = IMAGE_DATA_URI_REGEX.test(value);
  const isUrl = IMAGE_URL_REGEX.test(value);

  if (!isDataUri && !isUrl) {
    const error = new Error("Profile image must be a valid image URL or data URI");
    error.statusCode = 422;
    throw error;
  }

  if (isDataUri) {
    const base64Payload = value.split(",")[1] || "";
    const estimatedBytes = Math.ceil((base64Payload.length * 3) / 4);

    if (estimatedBytes > MAX_IMAGE_BYTES) {
      const error = new Error("Profile image must be 2MB or smaller");
      error.statusCode = 422;
      throw error;
    }
  }

  return true;
};

const buildAllowedPatch = (payload, allowedFields) => {
  const patch = {};

  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      const value = payload[key];

      if (typeof value === "string") {
        const normalized = normalizeString(value);
        if (normalized !== undefined) {
          patch[key] = normalized;
        }
      } else if (value !== undefined) {
        patch[key] = value;
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "email")) {
    if (typeof payload.email === "string" && payload.email.trim()) {
      patch.email = payload.email.trim().toLowerCase();
    } else if (payload.email === "" || payload.email === null) {
      delete patch.email;
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "phone")) {
    if (typeof payload.phone === "string" && payload.phone.trim()) {
      patch.phone = payload.phone.trim();
    } else if (payload.phone === "" || payload.phone === null) {
      delete patch.phone;
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "profileImage")) {
    const profileImage = normalizeProfileImage(payload.profileImage);
    if (profileImage) {
      validateProfileImage(profileImage);
      patch.profileImage = profileImage;
    } else {
      patch.profileImage = "";
    }
  }

  return patch;
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
    const conflictField =
      (email && existing.email === email && "email") ||
      (phone && existing.phone === phone && "phone") ||
      (employeeId && existing.employeeId === employeeId && "employeeId") ||
      "field";

    const error = new Error(`${conflictField} already exists`);
    error.statusCode = 409;
    throw error;
  }
};

const getProfile = async (userId) => {
  const user = await User.findById(userId).select("-password -__v");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return serializeUser(user);
};

const updateProfile = async ({ userId, payload, actor }) => {
  const user = await User.findById(userId).select("-password -__v");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const patch = buildAllowedPatch(payload, ["name", "email", "phone", "profileImage"]);

  if (!patch.name) {
    const error = new Error("Name is required");
    error.statusCode = 422;
    throw error;
  }

  await ensureUniqueUserFields({
    email: patch.email,
    phone: patch.phone,
    excludeUserId: userId,
  });

  user.set(patch);
  user.updatedBy = actor._id;
  await user.save();

  return serializeUser(user);
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

  const samePassword = await bcrypt.compare(newPassword, user.password);

  if (samePassword) {
    const error = new Error("New password must be different from current password");
    error.statusCode = 400;
    throw error;
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.updatedBy = user._id;
  await user.save();

  return true;
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  validateProfileImage,
  buildAllowedPatch,
};
