const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const createCorsOptions = require("./cors");
require("./cloudinary");
const {
  errorHandler,
  multerErrorHandler,
} = require("../middleware/errorHandlers");
const createRateLimiters = require("../middleware/rateLimiters");
const registerRoutes = require("../routes");

const createApp = () => {
  const app = express();
  const { authLimiter, genericLimiter } = createRateLimiters();

  app.use(helmet());
  app.use(morgan("combined"));
  app.use(cors(createCorsOptions()));
  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: false, limit: "10kb" }));
  app.use(genericLimiter);
  app.use(cors());

  registerRoutes(app, { authLimiter });

  app.use(multerErrorHandler);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
