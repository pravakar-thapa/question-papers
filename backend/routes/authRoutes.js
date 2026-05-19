const express = require("express");
const { login, signup } = require("../controllers/authController");
const { asyncHandler } = require("../utils/responses");

const createAuthRoutes = ({ authLimiter }) => {
  const router = express.Router();

  router.post("/login", authLimiter, asyncHandler(login));
  router.post("/signup", authLimiter, asyncHandler(signup));

  return router;
};

module.exports = createAuthRoutes;
