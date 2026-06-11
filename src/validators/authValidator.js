const { body } = require("express-validator");

const passwordRule =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("employeeId").trim().notEmpty().withMessage("Employee ID is required"),
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
  body().custom((value) => {
    if (!value.email && !value.phone) {
      throw new Error("Email or phone is required");
    }
    return true;
  }),
  body("password")
    .matches(passwordRule)
    .withMessage(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
    ),
];

const loginValidator = [
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
  body().custom((value) => {
    if (!value.email && !value.phone) {
      throw new Error("Email or phone is required");
    }

    if (value.email && value.phone) {
      throw new Error("Use either email or phone, not both");
    }

    return true;
  }),
  body("password").notEmpty().withMessage("Password is required"),
];

module.exports = {
  registerValidator,
  loginValidator,
  passwordRule,
};
