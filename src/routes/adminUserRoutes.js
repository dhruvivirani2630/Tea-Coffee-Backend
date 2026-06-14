const express = require("express");
const adminUserController = require("../controllers/adminUserController");
const { authenticate } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const validate = require("../middlewares/validationMiddleware");
const {
  listUsersValidator,
  updateUserValidator,
  mongoIdParam,
} = require("../validators/adminUserValidator");

const router = express.Router();

router.use(authenticate, authorize("admin"));

router.get("/users", listUsersValidator, validate, adminUserController.getUsers);
router.get("/users/:id", mongoIdParam, validate, adminUserController.getUserById);
router.put("/users/:id", updateUserValidator, validate, adminUserController.updateUser);

module.exports = router;
