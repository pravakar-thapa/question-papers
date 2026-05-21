const rateLimit = require("express-rate-limit");
const env = require("../config/env");

const passThroughLimiter = (req, res, next) => next();

const createRateLimiters = () => {
  const isDevelopment = env.NODE_ENV !== "production";

  if (isDevelopment) {
    return {
      authLimiter: passThroughLimiter,
      genericLimiter: passThroughLimiter,
    };
  }

  return {
    genericLimiter: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
      message: { message: "Too many requests, please try again later." },
    }),
    authLimiter: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message: "Too many authentication attempts, please try again later.",
      },
    }),
  };
};

module.exports = createRateLimiters;
