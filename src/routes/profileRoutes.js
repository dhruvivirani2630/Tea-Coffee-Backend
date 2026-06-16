const express = require("express");
const profileController = require("../controllers/profileController");
const { authenticate } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validationMiddleware");
const {
  updateProfileValidator,
  changePasswordValidator,
} = require("../validators/profileValidator");

const router = express.Router();

router.use(authenticate);

router.get("/profile", profileController.getProfile);
router.put("/update-profile", updateProfileValidator, validate, profileController.updateProfile);
router.put(
  "/change-password",
  changePasswordValidator,
  validate,
  profileController.changePassword
);

module.exports = router;
