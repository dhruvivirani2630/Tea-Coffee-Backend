const profileService = require("../services/profileService");
const { sendSuccess } = require("../utils/responseHandler");

const getProfile = async (req, res, next) => {
  try {
    const user = await profileService.getProfile(req.user._id);
    return sendSuccess(res, 200, "Profile fetched successfully", { user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await profileService.updateProfile({
      userId: req.user._id,
      payload: req.body,
      actor: req.user,
    });

    return sendSuccess(res, 200, "Profile updated successfully", { user });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await profileService.changePassword({
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
  getProfile,
  updateProfile,
  changePassword,
};
