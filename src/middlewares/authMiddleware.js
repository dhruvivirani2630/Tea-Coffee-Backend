const jwt = require("jsonwebtoken");
const User = require("../models/User");
const jwtConfig = require("../config/jwt");
const { sendError } = require("../utils/responseHandler");

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return req.cookies?.[jwtConfig.cookieName];
};

const authenticate = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return sendError(res, 401, "Authentication required");
    }

    const decoded = jwt.verify(token, jwtConfig.secret);
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 401, "User no longer exists");
    }

    if (user.status !== "active") {
      return sendError(res, 403, "Account is inactive");
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 401, "Invalid or expired token");
  }
};

module.exports = {
  authenticate,
};
