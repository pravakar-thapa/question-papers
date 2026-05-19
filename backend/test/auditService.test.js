const assert = require("node:assert/strict");
const test = require("node:test");

const {
  AUDIT_ACTIONS,
  createAuditLogPayload,
} = require("../services/auditService");

test("audit payload captures actor, pdf, status transition and metadata", () => {
  const payload = createAuditLogPayload({
    action: AUDIT_ACTIONS.EDITED,
    actor: {
      userId: "user-1",
      username: "rayan",
      role: "admin",
    },
    pdf: {
      _id: "pdf-1",
      title: "math",
      college: "abc",
      course: "bca",
      semester: "4",
      year: 2025,
      fileHash: "hash",
    },
    statusFrom: "approved",
    statusTo: "pending",
    reason: "metadata fix",
    metadata: { fileReplaced: true },
  });

  assert.equal(payload.action, "edited");
  assert.deepEqual(payload.actor, {
    userId: "user-1",
    username: "rayan",
    role: "admin",
  });
  assert.equal(payload.pdf, "pdf-1");
  assert.equal(payload.pdfTitle, "math");
  assert.equal(payload.statusFrom, "approved");
  assert.equal(payload.statusTo, "pending");
  assert.equal(payload.reason, "metadata fix");
  assert.equal(payload.metadata.fileHash, "hash");
  assert.equal(payload.metadata.fileReplaced, true);
});
