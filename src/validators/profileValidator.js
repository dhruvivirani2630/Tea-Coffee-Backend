const { body } = require("express-validator");
const { passwordRule } = require("./authValidator");

const allowedProfileFields = ["name", "email", "phone", "profileImage"];
const restrictedProfileFields = [
  "role",
  "employeeId",
  "password",
  "status",
  "createdAt",
  "updatedAt",
];
const imageDataUri =
  /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=\r\n]+$/i;
const imageUrl = /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i;
const maxBase64Size = 2 * 1024 * 1024;
const phonePattern = /^\+?[0-9\s().-]{7,20}$/;

const trimString = (value) => (typeof value === "string" ? value.trim() : value);
const cleanString = (value) =>
  typeof value === "string" ? value.trim().replace(/[\u0000-\u001F\u007F]/g, "") : value;

const allowedFieldsValidator = body().custom((_, { req }) => {
  const keys = Object.keys(req.body || {});
  const restricted = keys.find((key) => restrictedProfileFields.includes(key));

  if (restricted) {
    throw new Error(`${restricted} cannot be updated from this endpoint`);
  }

  const unknown = keys.find((key) => !allowedProfileFields.includes(key));

  if (unknown) {
    throw new Error(`${unknown} is not an allowed profile field`);
  }

  if (!keys.length) {
    throw new Error("At least one profile field is required");
  }

  return true;
});

const profileImageValidator = body("profileImage").optional().custom((value) => {
  if (!value) {
    return true;
  }

  const validSource = imageDataUri.test(value) || imageUrl.test(value);

  if (!validSource) {
    throw new Error("Profile image must be a valid image URL or data URI");
  }

  if (imageDataUri.test(value)) {
    const base64Payload = value.split(",")[1] || "";
    const estimatedBytes = Math.ceil((base64Payload.length * 3) / 4);

    if (estimatedBytes > maxBase64Size) {
      throw new Error("Profile image must be 2MB or smaller");
    }
  }

  return true;
});

const updateProfileValidator = [
  allowedFieldsValidator,

  body("name")
    .optional()
    .customSanitizer(cleanString)
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .optional({ checkFalsy: true })
    .customSanitizer(trimString)
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail(),

  body("phone")
    .optional({ checkFalsy: true })
    .customSanitizer(trimString)
    .isLength({ min: 7, max: 20 })
    .withMessage("Phone number must be between 7 and 20 characters")
    .bail()
    .matches(phonePattern)
    .withMessage("Phone number format is invalid")
    .bail()
    .custom((value) => {
      const digitCount = String(value).replace(/\D/g, "").length;

      if (digitCount < 7) {
        throw new Error("Phone number must contain at least 7 digits");
      }

      return true;
    }),

  body("profileImage")
    .optional()
    .customSanitizer(trimString),

  profileImageValidator,
];

const changePasswordValidator = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .matches(passwordRule)
    .withMessage(
      "New password must be at least 8 characters and include uppercase, lowercase, number, and special character"
    ),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("Confirm password does not match new password"),
];

module.exports = {
  updateProfileValidator,
  changePasswordValidator,
  profileImageValidator,
};
