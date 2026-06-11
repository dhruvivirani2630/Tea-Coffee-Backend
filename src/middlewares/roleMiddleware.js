const { sendError } = require("../utils/responseHandler");

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 403, "You are not authorized to perform this action");
    }

    next();
  };
};

module.exports = {
  authorize,
};
