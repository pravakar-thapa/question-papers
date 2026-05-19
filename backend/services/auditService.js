const AuditLog = require("../models/AuditLog");

const AUDIT_ACTIONS = {
  UPLOADED: "uploaded",
  EDITED: "edited",
  APPROVED: "approved",
  REJECTED: "rejected",
  DELETED: "deleted",
  RESTORED: "restored",
};

const pickPdfMetadata = (pdf) => ({
  title: pdf?.title,
  college: pdf?.college,
  course: pdf?.course,
  semester: pdf?.semester,
  year: pdf?.year,
  fileHash: pdf?.fileHash,
});

const createAuditLogPayload = ({
  action,
  actor,
  pdf,
  statusFrom,
  statusTo,
  reason,
  metadata = {},
  req,
}) => ({
  action,
  actor: actor
    ? {
        userId: actor.userId,
        username: actor.username,
        role: actor.role,
      }
    : undefined,
  pdf: pdf?._id,
  pdfTitle: pdf?.title,
  statusFrom,
  statusTo,
  reason,
  metadata: {
    ...pickPdfMetadata(pdf),
    ...metadata,
  },
  request: req
    ? {
        ip: req.ip,
        userAgent: req.get?.("user-agent"),
      }
    : undefined,
});

const logAuditEvent = async (details) => {
  try {
    return await AuditLog.create(createAuditLogPayload(details));
  } catch (err) {
    console.error("Audit log write failed:", err);
    return null;
  }
};

module.exports = {
  AUDIT_ACTIONS,
  createAuditLogPayload,
  logAuditEvent,
};
