const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");
const {
  passwordValidationError,
  purgeExpiredDeletionRequests,
} = require("../services/accountService");
const { sendError, sendResponse } = require("../utils/responses");
const { collapseWhitespace } = require("../utils/sanitize");

const sanitizeUsername = (value) => collapseWhitespace(value).toLowerCase();

const login = async (req, res) => {
  await purgeExpiredDeletionRequests();

  const username = sanitizeUsername(req.body.username);
  const { password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return sendError(res, 401, "User not found");
  }
  if (user.isBanned) {
    return sendError(res, 403, "This account has been banned");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return sendError(res, 401, "Invalid password");
  }

  const token = jwt.sign(
    {
      userId: user._id,
      username: user.username,
      role: user.role,
      deletionScheduledFor: user.deletionScheduledFor,
    },
    env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  sendResponse(res, "Login successful", {
    token,
    deletionScheduledFor: user.deletionScheduledFor,
  });
};

const signup = async (req, res) => {
  await purgeExpiredDeletionRequests();

  const username = sanitizeUsername(req.body.username);
  const { password } = req.body;

  if (!username || !password) {
    return sendError(res, 400, "All fields required");
  }
  if (!/^[a-z0-9_.-]{3,30}$/.test(username)) {
    return sendError(res, 400, "Invalid username");
  }
  const validationError = passwordValidationError(password);
  if (validationError) {
    return sendError(res, 400, validationError);
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return sendError(res, 400, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    username,
    password: hashedPassword,
  });

  sendResponse(res, "User created successfully");
};

module.exports = {
  login,
  signup,
};
