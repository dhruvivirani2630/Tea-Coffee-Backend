const express = require("express");
const authController = require("../controllers/authController");
const { authenticate } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validationMiddleware");
const {
  registerValidator,
  loginValidator,
} = require("../validators/authValidator");

const router = express.Router();

router.post("/register", registerValidator, validate, authController.register);
router.post("/login", loginValidator, validate, authController.login);
router.post("/logout", authenticate, authController.logout);
router.get("/profile", authenticate, authController.profile);

module.exports = router;
