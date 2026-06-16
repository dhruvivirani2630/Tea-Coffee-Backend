const bcrypt = require("bcryptjs");
const User = require("../models/User");

const ALLOWED_PROFILE_FIELDS = ["name", "email", "phone", "profileImage"];
const RESTRICTED_PROFILE_FIELDS = [
  "role",
  "employeeId",
  "password",
  "status",
  "createdAt",
  "updatedAt",
];
const IMAGE_DATA_URI_REGEX = /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=\r\n]+$/i;
const IMAGE_URL_REGEX = /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const PHONE_REGEX = /^\+?[0-9\s().-]{7,20}$/;

const serializeProfile = (user) => {
  const object = user.toObject ? user.toObject() : { ...user };

  return {
    id: object._id?.toString(),
    name: object.name,
    email: object.email,
    phone: object.phone,
    employeeId: object.employeeId,
    role: object.role,
    profileImage: object.profileImage,
    createdAt: object.createdAt,
    updatedAt: object.updatedAt,
  };
};

const normalizeString = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim().replace(/[\u0000-\u001F\u007F]/g, "");
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

const validatePatch = (patch) => {
  if (patch.name !== undefined) {
    if (patch.name.length < 2 || patch.name.length > 100) {
      const error = new Error(
        "Name must be between 2 and 100 characters"
      );
      error.statusCode = 422;
      throw error;
    }
  }

  if (patch.phone !== undefined) {
    const digitCount = patch.phone.replace(/\D/g, "").length;

    if (!PHONE_REGEX.test(patch.phone) || digitCount < 7) {
      const error = new Error("Phone number format is invalid");
      error.statusCode = 422;
      throw error;
    }
  }
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

const assertNoRestrictedFields = (payload) => {
  const keys = Object.keys(payload || {});
  const restricted = keys.find((key) => RESTRICTED_PROFILE_FIELDS.includes(key));

  if (restricted) {
    const error = new Error(`${restricted} cannot be updated from this endpoint`);
    error.statusCode = 403;
    throw error;
  }

  const unknown = keys.find((key) => !ALLOWED_PROFILE_FIELDS.includes(key));

  if (unknown) {
    const error = new Error(`${unknown} is not an allowed profile field`);
    error.statusCode = 422;
    throw error;
  }

  if (!keys.length) {
    const error = new Error("At least one profile field is required");
    error.statusCode = 422;
    throw error;
  }
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

  return serializeProfile(user);
};

const updateProfile = async ({ userId, payload, actor }) => {
  assertNoRestrictedFields(payload);

  const user = await User.findById(userId).select("-password -__v");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const patch = buildAllowedPatch(payload, ALLOWED_PROFILE_FIELDS);
  validatePatch(patch);

  await ensureUniqueUserFields({
    email: patch.email && patch.email !== user.email ? patch.email : undefined,
    phone: patch.phone && patch.phone !== user.phone ? patch.phone : undefined,
    excludeUserId: userId,
  });

  user.set(patch);
  user.updatedBy = actor._id;
  await user.save();

  return serializeProfile(user);
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
  serializeProfile,
};
