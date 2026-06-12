const env = require("./config/env");
const app = require("./app");
const connectDB = require("./config/db");
const logger = require("./utils/logger");

const startServer = async () => {
  await connectDB();

  app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port}`);
  });
};

startServer();
