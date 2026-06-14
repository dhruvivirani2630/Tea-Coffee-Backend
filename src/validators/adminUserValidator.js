const { body, param, query } = require("express-validator");
const { profileImageValidator } = require("./profileValidator");

const mongoIdParam = [param("id").isMongoId().withMessage("Invalid user id")];

const listUsersValidator = [
  query("search").optional().trim().isLength({ max: 120 }),
  query("employeeId").optional().trim().isLength({ max: 50 }),
  query("role").optional().isIn(["admin", "user"]).withMessage("Role must be admin or user"),
  query("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be active or inactive"),
];

const updateUserValidator = [
  ...mongoIdParam,
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
  body("role").isIn(["admin", "user"]).withMessage("Role must be admin or user"),
  body("status")
    .isIn(["active", "inactive"])
    .withMessage("Status must be active or inactive"),
  profileImageValidator,
];

module.exports = {
  mongoIdParam,
  listUsersValidator,
  updateUserValidator,
};
