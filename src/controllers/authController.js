const authService = require("../services/authService");
const jwtConfig = require("../config/jwt");
const { sendSuccess } = require("../utils/responseHandler");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

const register = async (req, res, next) => {
  try {
    const data = await authService.registerUser(req.body);
    res.cookie(jwtConfig.cookieName, data.token, cookieOptions);
    return sendSuccess(res, 201, "User registered successfully", data);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.loginUser(req.body);
    res.cookie(jwtConfig.cookieName, data.token, cookieOptions);
    return sendSuccess(res, 200, "Login successful", data);
  } catch (error) {
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
