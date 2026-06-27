const express = require("express");
const adminUserController = require("../controllers/adminUserController");
const { authenticate } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const {
  updateUserValidator,
  mongoIdParam,
} = require("../validators/adminUserValidator");

const router = express.Router();

router.use(authenticate, authorize("admin"));

router.get("/users", adminUserController.getUsers);
router.get("/users/:id", mongoIdParam, adminUserController.getUserById);
router.put("/users/:id", updateUserValidator, adminUserController.updateUser);

module.exports = router;
