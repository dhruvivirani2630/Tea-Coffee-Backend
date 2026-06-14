const authService = require("../services/authService");
const jwtConfig = require("../config/jwt");
const { sendSuccess } = require("../utils/responseHandler");
const logger = require("../utils/logger");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

const register = async (req, res, next) => {
  try {
    logger.info("Register request received", {
      employeeId: req.body.employeeId,
      email: req.body.email,
      phone: req.body.phone,
    });

    const data = await authService.registerUser(req.body);

    logger.info("Register successful", {
      userId: data.user._id,
      employeeId: data.user.employeeId,
      email: data.user.email,
      phone: data.user.phone,
    });

    res.cookie(jwtConfig.cookieName, data.token, cookieOptions);
    return sendSuccess(res, 201, "User registered successfully", data);
  } catch (error) {
    logger.error("Register failed", {
      employeeId: req.body.employeeId,
      email: req.body.email,
      phone: req.body.phone,
      error: error.message,
    });
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    logger.info("Login request received", {
      email: req.body.email,
      phone: req.body.phone,
      identifier: req.body.identifier,
    });

    const data = await authService.loginUser(req.body);

    logger.info("Login successful", {
      userId: data.user._id,
      employeeId: data.user.employeeId,
      email: data.user.email,
      phone: data.user.phone,
    });

    res.cookie(jwtConfig.cookieName, data.token, cookieOptions);
    return sendSuccess(res, 200, "Login successful", data);
  } catch (error) {
    logger.error("Login failed", {
      email: req.body.email,
      phone: req.body.phone,
      identifier: req.body.identifier,
      error: error.message,
    });
    next(error);
  }
};

const logout = async (req, res) => {
  res.clearCookie(jwtConfig.cookieName, cookieOptions);
  return sendSuccess(res, 200, "Logout successful");
};

const profile = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user._id);
    return sendSuccess(res, 200, "Current user fetched successfully", { user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  profile,
};
