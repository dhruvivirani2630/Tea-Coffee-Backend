const { sendError } = require("../utils/responseHandler");

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || "field";
    return sendError(res, 409, `${field} already exists`);
  }

  if (error.name === "CastError") {
    return sendError(res, 400, "Invalid resource id");
  }

  if (error.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((item) => item.message)
      .join(", ");
    return sendError(res, 400, message);
  }

  return sendError(
    res,
    statusCode,
    statusCode === 500 ? "Internal server error" : error.message
  );
};

module.exports = {
  notFound,
  errorHandler,
};
