const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");

const generateToken = (user) => {
  if (!jwtConfig.secret) {
    throw new Error("JWT_SECRET is required");
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    jwtConfig.secret,
    {
      expiresIn: jwtConfig.expiresIn,
    }
  );
};

module.exports = generateToken;
