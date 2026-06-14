const adminUserService = require("../services/adminUserService");
const { sendSuccess } = require("../utils/responseHandler");

const getUsers = async (req, res, next) => {
  try {
    const users = await adminUserService.getUsers(req.query);
    return sendSuccess(res, 200, "Users fetched successfully", { users });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await adminUserService.getUserById(req.params.id);
    return sendSuccess(res, 200, "User fetched successfully", { user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await adminUserService.updateUser({
      targetUserId: req.params.id,
      payload: req.body,
      actor: req.user,
    });

    return sendSuccess(res, 200, "User updated successfully", { user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
};
