const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["uploaded", "edited", "approved", "rejected", "deleted", "restored"],
      required: true,
      index: true,
    },
    actor: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      username: String,
      role: String,
    },
    pdf: { type: mongoose.Schema.Types.ObjectId, ref: "PDF", index: true },
    pdfTitle: String,
    statusFrom: String,
    statusTo: String,
    reason: String,
    metadata: mongoose.Schema.Types.Mixed,
    request: {
      ip: String,
      userAgent: String,
    },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ "actor.userId": 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
