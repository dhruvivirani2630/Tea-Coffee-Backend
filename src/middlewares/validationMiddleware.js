const { validationResult } = require("express-validator");
const { sendError } = require("../utils/responseHandler");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((error) => error.msg)
      .join(", ");

    return sendError(res, 422, message);
  }

  next();
};

module.exports = validate;
