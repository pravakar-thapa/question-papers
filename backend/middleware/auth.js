const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");
const {
  permanentlyDeleteUserAccount,
} = require("../services/accountService");
const { sendError } = require("../utils/responses");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return sendError(res, 401, "Authorization required");
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select(
      "username role isBanned deletionScheduledFor",
    );

    if (!user) {
      return sendError(res, 401, "Invalid session user");
    }
    if (user.deletionScheduledFor && user.deletionScheduledFor <= new Date()) {
      await permanentlyDeleteUserAccount(user._id);
      return sendError(res, 401, "Account has been deleted");
    }
    if (user.isBanned) {
      return sendError(res, 403, "This account has been banned");
    }

    req.user = {
      ...decoded,
      username: user.username,
      role: user.role,
      deletionScheduledFor: user.deletionScheduledFor,
    };
    next();
  } catch (error) {
    return sendError(res, 401, "Invalid or expired token");
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return sendError(res, 403, "Admin role required");
  }
  next();
};

module.exports = {
  verifyAdmin,
  verifyToken,
};
