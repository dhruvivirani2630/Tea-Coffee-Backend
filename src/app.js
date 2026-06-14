const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const { sendSuccess } = require("./utils/responseHandler");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests, please try again later",
    },
  })
);

app.get("/", (req, res) => {
  return sendSuccess(res, 200, "Tea Coffee API running", {
    service: "User Authentication and Role Management API",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminUserRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
