const bcrypt = require("bcryptjs");
const AuditLog = require("../models/AuditLog");
const PDF = require("../models/PDF");
const User = require("../models/User");
const { canApprovePdf, duplicateQueryFor } = require("../services/pdfWorkflow");
const { sendError, sendResponse } = require("../utils/responses");
const { sanitizeReviewComment } = require("../utils/sanitize");
const { isValidObjectId } = require("../utils/validators");
const { parsePagination } = require("../utils/query");
const { AUDIT_ACTIONS, logAuditEvent } = require("../services/auditService");
const {
  adjustContributionForStatusChange,
} = require("../services/userService");
const {
  passwordValidationError,
  permanentlyDeleteUserAccount,
} = require("../services/accountService");
const {
  deletePdfDocument,
  findDuplicateContext,
} = require("../services/pdfService");

const assertNoApprovedDuplicate = async (pdf) => {
  const duplicateQuery = duplicateQueryFor({
    title: pdf.title,
    college: pdf.college,
    course: pdf.course,
    semester: pdf.semester,
    year: pdf.year,
    fileHash: pdf.fileHash,
  });
  const { publicDuplicate } = await findDuplicateContext({
    ...duplicateQuery,
    _id: { $ne: pdf._id },
  });

  return canApprovePdf({ publicDuplicate });
};

const reviewPdf = async (req, res) => {
  const { status } = req.body;
  const reviewComment = sanitizeReviewComment(req.body.reviewComment);
  const allowedStatuses = ["approved", "rejected"];

  if (!allowedStatuses.includes(status)) {
    return sendError(res, 400, "Invalid status value");
  }

  const pdf = await PDF.findById(req.params.id);
  if (!pdf) {
    return sendError(res, 404, "PDF not found");
  }

  if (status === "approved") {
    const approvalCheck = await assertNoApprovedDuplicate(pdf);
    if (!approvalCheck.ok) {
      return sendError(res, 400, approvalCheck.message, {
        existingPdf: approvalCheck.existingPdf,
      });
    }
  }

  const previousStatus = pdf.status;
  pdf.status = status;
  pdf.reviewComment = reviewComment || pdf.reviewComment;
  pdf.reviewedBy = req.user.userId;

  await pdf.save();
  await adjustContributionForStatusChange({
    submittedBy: pdf.submittedBy,
    statusFrom: previousStatus,
    statusTo: pdf.status,
  });
  await logAuditEvent({
    action:
      status === "approved" ? AUDIT_ACTIONS.APPROVED : AUDIT_ACTIONS.REJECTED,
    actor: req.user,
    pdf,
    statusFrom: previousStatus,
    statusTo: pdf.status,
    reason: reviewComment,
    req,
  });
  sendResponse(res, `PDF ${status} successfully`, { pdf });
};

const restorePdf = async (req, res) => {
  const pdf = await PDF.findById(req.params.id);
  if (!pdf) {
    return sendError(res, 404, "PDF not found");
  }
  if (pdf.status !== "deleted") {
    return sendError(res, 400, "Only deleted PDFs can be restored");
  }

  const approvalCheck = await assertNoApprovedDuplicate(pdf);
  if (!approvalCheck.ok) {
    return sendError(res, 400, approvalCheck.message, {
      existingPdf: approvalCheck.existingPdf,
    });
  }

  const previousStatus = pdf.status;
  const reason = sanitizeReviewComment(req.body?.reviewComment);
  pdf.status = "approved";
  pdf.reviewedBy = req.user.userId;
  pdf.reviewComment = reason || "Restored by admin";

  await pdf.save();
  await adjustContributionForStatusChange({
    submittedBy: pdf.submittedBy,
    statusFrom: previousStatus,
    statusTo: pdf.status,
  });
  await logAuditEvent({
    action: AUDIT_ACTIONS.RESTORED,
    actor: req.user,
    pdf,
    statusFrom: previousStatus,
    statusTo: pdf.status,
    reason: pdf.reviewComment,
    req,
  });

  sendResponse(res, "PDF restored successfully", { pdf });
};

const getPendingPdfs = async (req, res) => {
  const pendingPdfs = await PDF.find({ status: "pending" })
    .populate("submittedBy", "username role")
    .populate({
      path: "duplicateOf",
      select: "status submittedByName reviewedBy",
      populate: { path: "reviewedBy", select: "username role" },
    })
    .sort({ createdAt: -1 })
    .lean();
  sendResponse(res, "Pending PDFs retrieved", { pendingPdfs });
};

const getAllPdfs = async (req, res) => {
  const pdfs = await PDF.find({})
    .populate("submittedBy", "username role")
    .populate("reviewedBy", "username role")
    .populate({
      path: "duplicateOf",
      select: "status submittedByName reviewedBy",
      populate: { path: "reviewedBy", select: "username role" },
    })
    .sort({ createdAt: -1 })
    .lean();
  sendResponse(res, "All PDFs retrieved", { pdfs });
};

const getAllUsers = async (req, res) => {
  const users = await User.find({})
    .select("-password -savedPdfs")
    .populate("bannedBy", "username role")
    .sort({ createdAt: -1, username: 1 })
    .lean();

  sendResponse(res, "Users retrieved", { users });
};

const updateUserRole = async (req, res) => {
  const { role } = req.body;
  if (!["user", "admin"].includes(role)) {
    return sendError(res, 400, "Invalid role");
  }
  if (!isValidObjectId(req.params.id)) {
    return sendError(res, 400, "Invalid user id");
  }
  if (String(req.params.id) === String(req.user.userId)) {
    return sendError(res, 400, "You cannot change your own role");
  }

  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  user.role = role;
  await user.save();

  sendResponse(res, `User ${role === "admin" ? "promoted" : "updated"}`, {
    user,
  });
};

const updateUserBan = async (req, res) => {
  const isBanned = Boolean(req.body?.isBanned);
  const reason = sanitizeReviewComment(req.body?.reason);

  if (!isValidObjectId(req.params.id)) {
    return sendError(res, 400, "Invalid user id");
  }
  if (String(req.params.id) === String(req.user.userId)) {
    return sendError(res, 400, "You cannot ban your own account");
  }
  if (isBanned && !reason) {
    return sendError(res, 400, "Ban reason is required");
  }

  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  user.isBanned = isBanned;
  user.bannedAt = isBanned ? new Date() : undefined;
  user.bannedBy = isBanned ? req.user.userId : undefined;
  user.banReason = isBanned ? reason : "";

  await user.save();

  sendResponse(res, isBanned ? "User banned" : "User unbanned", { user });
};

const resetUserPassword = async (req, res) => {
  const { newPassword } = req.body;
  const validationError = passwordValidationError(newPassword);
  if (validationError) {
    return sendError(res, 400, validationError);
  }
  if (!isValidObjectId(req.params.id)) {
    return sendError(res, 400, "Invalid user id");
  }

  const user = await User.findById(req.params.id).select("-savedPdfs");
  if (!user) {
    return sendError(res, 404, "User not found");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  sendResponse(res, "User password reset successfully");
};

const deleteUser = async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return sendError(res, 400, "Invalid user id");
  }
  if (String(req.params.id) === String(req.user.userId)) {
    return sendError(res, 400, "You cannot delete your own account here");
  }

  const deletedUser = await permanentlyDeleteUserAccount(req.params.id);
  if (!deletedUser) {
    return sendError(res, 404, "User not found");
  }

  sendResponse(res, "User deleted successfully", {
    user: {
      _id: deletedUser._id,
      username: deletedUser.username,
    },
  });
};

const deleteAllPdfs = async (req, res) => {
  const all = await PDF.find({});
  let deleted = 0;
  for (const pdf of all) {
    await logAuditEvent({
      action: AUDIT_ACTIONS.DELETED,
      actor: req.user,
      pdf,
      statusFrom: pdf.status,
      reason: "Admin bulk delete all",
      metadata: { permanent: true, bulk: true },
      req,
    });
    await adjustContributionForStatusChange({
      submittedBy: pdf.submittedBy,
      statusFrom: pdf.status,
      statusTo: undefined,
    });
    await deletePdfDocument(pdf);
    deleted += 1;
  }
  sendResponse(res, `Permanently deleted ${deleted} PDF(s)`, { deleted });
};

const bulkDeletePdfs = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return sendError(res, 400, "Provide a non-empty ids array");
  }

  const pdfs = await PDF.find({ _id: { $in: ids } });
  let deleted = 0;
  for (const pdf of pdfs) {
    await logAuditEvent({
      action: AUDIT_ACTIONS.DELETED,
      actor: req.user,
      pdf,
      statusFrom: pdf.status,
      reason: "Admin bulk delete",
      metadata: { permanent: true, bulk: true },
      req,
    });
    await adjustContributionForStatusChange({
      submittedBy: pdf.submittedBy,
      statusFrom: pdf.status,
      statusTo: undefined,
    });
    await deletePdfDocument(pdf);
    deleted += 1;
  }
  sendResponse(res, `Permanently deleted ${deleted} PDF(s)`, { deleted });
};

const getStats = async (req, res) => {
  const totalPdfs = await PDF.countDocuments();
  const approvedPdfs = await PDF.countDocuments({ status: "approved" });
  const pendingPdfs = await PDF.countDocuments({ status: "pending" });
  const rejectedPdfs = await PDF.countDocuments({ status: "rejected" });
  const totalUsers = await User.countDocuments();
  const adminUploads = await PDF.countDocuments({ submittedByName: "admin" });
  const userUploads = totalPdfs - adminUploads;

  sendResponse(res, "Admin stats retrieved", {
    totalPdfs,
    approvedPdfs,
    pendingPdfs,
    rejectedPdfs,
    totalUsers,
    adminUploads,
    userUploads,
  });
};

const getAuditLogs = async (req, res) => {
  const { action, pdfId, actorId } = req.query;
  const query = {};

  if (action) {
    if (!Object.values(AUDIT_ACTIONS).includes(action)) {
      return sendError(res, 400, "Invalid audit action");
    }
    query.action = action;
  }
  if (pdfId) {
    if (!isValidObjectId(pdfId)) {
      return sendError(res, 400, "Invalid PDF id");
    }
    query.pdf = pdfId;
  }
  if (actorId) {
    if (!isValidObjectId(actorId)) {
      return sendError(res, 400, "Invalid actor id");
    }
    query["actor.userId"] = actorId;
  }

  const {
    page: currentPage,
    limit: pageSize,
    skip,
  } = parsePagination(req.query);

  const [total, logs] = await Promise.all([
    AuditLog.countDocuments(query),
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
  ]);

  sendResponse(res, "Audit logs retrieved", {
    logs,
    pagination: {
      total,
      page: currentPage,
      pageSize,
      pages: Math.ceil(total / pageSize),
    },
  });
};

module.exports = {
  bulkDeletePdfs,
  deleteUser,
  deleteAllPdfs,
  getAuditLogs,
  getAllPdfs,
  getAllUsers,
  getPendingPdfs,
  getStats,
  reviewPdf,
  restorePdf,
  resetUserPassword,
  updateUserBan,
  updateUserRole,
};
