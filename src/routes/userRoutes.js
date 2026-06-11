const express = require("express");
const userController = require("../controllers/userController");
const { authenticate } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const validate = require("../middlewares/validationMiddleware");
const {
  mongoIdParam,
  listUsersValidator,
  updateUserValidator,
  updateStatusValidator,
  changePasswordValidator,
} = require("../validators/userValidator");

const router = express.Router();

router.use(authenticate);

router.get("/", authorize("admin"), listUsersValidator, validate, userController.getUsers);
router.patch(
  "/me/password",
  changePasswordValidator,
  validate,
  userController.changePassword
);
router.get("/:id", mongoIdParam, validate, userController.getUserById);
router.put("/:id", updateUserValidator, validate, userController.updateUser);
router.delete("/:id", authorize("admin"), mongoIdParam, validate, userController.deleteUser);
router.patch(
  "/:id/status",
  authorize("admin"),
  updateStatusValidator,
  validate,
  userController.updateUserStatus
);

module.exports = router;
