const userService = require("../services/userService");
const { sendSuccess } = require("../utils/responseHandler");

const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers(req.query);
    return sendSuccess(res, 200, "Users fetched successfully", { users });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin";
    const isSelf = req.user._id.toString() === req.params.id;

    if (!isAdmin && !isSelf) {
      const error = new Error("Users can only view their own profile");
      error.statusCode = 403;
      throw error;
    }

    const user = await userService.getUserById(req.params.id);
    return sendSuccess(res, 200, "User fetched successfully", { user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser({
      targetUserId: req.params.id,
      actor: req.user,
      payload: req.body,
    });

    return sendSuccess(res, 200, "User updated successfully", { user });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser({
      targetUserId: req.params.id,
      actor: req.user,
    });

    return sendSuccess(res, 200, "User deleted successfully");
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const user = await userService.updateUserStatus({
      targetUserId: req.params.id,
      status: req.body.status,
      actor: req.user,
    });

    return sendSuccess(res, 200, "User status updated successfully", { user });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await userService.changePassword({
      userId: req.user._id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });

    return sendSuccess(res, 200, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  changePassword,
};
