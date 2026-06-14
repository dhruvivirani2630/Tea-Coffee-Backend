const { body } = require("express-validator");
const { passwordRule } = require("./authValidator");

const imageDataUri =
  /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=\r\n]+$/i;
const imageUrl = /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i;
const maxBase64Size = 2 * 1024 * 1024;

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
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail(),
  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage("Phone number must be between 7 and 20 characters"),
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
