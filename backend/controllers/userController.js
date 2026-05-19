const bcrypt = require("bcryptjs");
const PDF = require("../models/PDF");
const User = require("../models/User");
const {
  deletionScheduleDate,
  passwordValidationError,
} = require("../services/accountService");
const { sendError, sendResponse } = require("../utils/responses");
const { sanitizeReviewComment } = require("../utils/sanitize");
const { areObjectIdsEqual, isValidObjectId } = require("../utils/validators");

const getMyAccount = async (req, res) => {
  const user = await User.findById(req.user.userId).select("-password");
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  sendResponse(res, "Account retrieved", { user });
};

const toggleSavedPdf = async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    return sendError(res, 404, "User not found");
  }

  const pdfId = req.params.pdfId;
  if (!isValidObjectId(pdfId)) {
    return sendError(res, 400, "Invalid PDF id");
  }

  const pdf = await PDF.findOne({ _id: pdfId, status: "approved" });
  if (!pdf) {
    return sendError(res, 404, "Approved PDF not found");
  }

  const alreadySaved = user.savedPdfs.some((id) => areObjectIdsEqual(id, pdfId));

  if (alreadySaved) {
    user.savedPdfs = user.savedPdfs.filter(
      (id) => !areObjectIdsEqual(id, pdfId),
    );
    await user.save();
    return sendResponse(res, "Removed from saved", { saved: false });
  }

  user.savedPdfs.push(pdfId);
  await user.save();
  sendResponse(res, "Saved successfully", { saved: true });
};

const getMyUploads = async (req, res) => {
  const uploads = await PDF.find({
    submittedBy: req.user.userId,
    status: { $ne: "deleted" },
  })
    .sort({ createdAt: -1 })
    .lean();
  sendResponse(res, "Uploads retrieved", { uploads });
};

const getSavedPdfs = async (req, res) => {
  const user = await User.findById(req.user.userId).populate({
    path: "savedPdfs",
    match: { status: "approved" },
  });
  sendResponse(res, "Saved PDFs retrieved", {
    savedPdfs: user.savedPdfs.filter(Boolean),
  });
};

const changeMyPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const validationError = passwordValidationError(newPassword);
  if (validationError) {
    return sendError(res, 400, validationError);
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  const isMatch = await bcrypt.compare(currentPassword || "", user.password);
  if (!isMatch) {
    return sendError(res, 401, "Current password is incorrect");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  sendResponse(res, "Password changed successfully");
};

const requestAccountDeletion = async (req, res) => {
  const password = req.body?.password;
  const reason = sanitizeReviewComment(req.body?.reason);
  const user = await User.findById(req.user.userId);
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  const isMatch = await bcrypt.compare(password || "", user.password);
  if (!isMatch) {
    return sendError(res, 401, "Password is incorrect");
  }

  const now = new Date();
  user.deletionRequestedAt = now;
  user.deletionScheduledFor = deletionScheduleDate(now);
  user.deletionReason = reason;
  user.deletionRequestedBy = "user";
  await user.save();

  sendResponse(res, "Account deletion scheduled", {
    deletionScheduledFor: user.deletionScheduledFor,
  });
};

const cancelAccountDeletion = async (req, res) => {
  const user = await User.findById(req.user.userId).select("-password");
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  user.deletionRequestedAt = undefined;
  user.deletionScheduledFor = undefined;
  user.deletionReason = "";
  user.deletionRequestedBy = undefined;
  await user.save();

  sendResponse(res, "Account deletion cancelled", { user });
};

module.exports = {
  cancelAccountDeletion,
  changeMyPassword,
  getMyAccount,
  getMyUploads,
  getSavedPdfs,
  requestAccountDeletion,
  toggleSavedPdf,
};
