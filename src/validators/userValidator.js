const { body, param, query } = require("express-validator");
const { passwordRule } = require("./authValidator");

const mongoIdParam = [
  param("id").isMongoId().withMessage("Invalid user id"),
];

const listUsersValidator = [
  query("role")
    .optional()
    .isIn(["admin", "user"])
    .withMessage("Role must be admin or user"),
  query("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be active or inactive"),
  query("search").optional().trim().isLength({ max: 120 }),
];

const updateUserValidator = [
  ...mongoIdParam,
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("employeeId")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Employee ID cannot be empty"),
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
  body("role")
    .optional()
    .isIn(["admin", "user"])
    .withMessage("Role must be admin or user"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be active or inactive"),
  body("password").not().exists().withMessage("Use change password endpoint"),
];

const updateStatusValidator = [
  ...mongoIdParam,
  body("status")
    .isIn(["active", "inactive"])
    .withMessage("Status must be active or inactive"),
];

const changePasswordValidator = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .matches(passwordRule)
    .withMessage(
      "New password must be at least 8 characters and include uppercase, lowercase, number, and special character"
    ),
];

module.exports = {
  mongoIdParam,
  listUsersValidator,
  updateUserValidator,
  updateStatusValidator,
  changePasswordValidator,
};
