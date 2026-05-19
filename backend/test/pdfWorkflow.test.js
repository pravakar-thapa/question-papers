const assert = require("node:assert/strict");
const test = require("node:test");

const {
  PUBLIC_DUPLICATE_MESSAGE,
  canApprovePdf,
  canDownloadPdf,
  chooseDuplicateContext,
  duplicateMetadata,
  duplicateQueryFor,
  softDeleteHistoryUpdate,
  uploadReviewState,
} = require("../services/pdfWorkflow");

const userUpload = {
  _id: "pending-1",
  status: "pending",
  submittedBy: { username: "rayan", role: "user" },
  submittedByName: "rayan",
};

const adminDeletedUpload = {
  _id: "deleted-1",
  status: "deleted",
  submittedBy: { username: "adminUploader", role: "admin" },
  reviewedBy: { username: "mainAdmin", role: "admin" },
};

test("duplicate query normalizes year to a number", () => {
  assert.deepEqual(
    duplicateQueryFor({
      title: "math",
      college: "abc",
      course: "bca",
      semester: "4",
      year: "2025",
    }),
    {
      title: "math",
      college: "abc",
      course: "bca",
      semester: "4",
      year: 2025,
    },
  );
});

test("duplicate query can match by metadata or file hash", () => {
  assert.deepEqual(
    duplicateQueryFor({
      title: "math",
      college: "abc",
      course: "bca",
      semester: "4",
      year: "2025",
      fileHash: "abc123",
    }),
    {
      $or: [
        {
          title: "math",
          college: "abc",
          course: "bca",
          semester: "4",
          year: 2025,
        },
        { fileHash: "abc123" },
      ],
    },
  );
});

test("approved duplicate blocks upload and approval", () => {
  const approved = {
    _id: "approved-1",
    status: "approved",
    url: "https://cdn.example.com/public.pdf",
  };

  const context = chooseDuplicateContext([userUpload, approved]);
  assert.equal(context.publicDuplicate, approved);
  assert.equal(context.reviewDuplicate, userUpload);

  assert.deepEqual(canApprovePdf({ publicDuplicate: approved }), {
    ok: false,
    message: PUBLIC_DUPLICATE_MESSAGE,
    existingPdf: approved.url,
  });
});

test("pending duplicate is allowed but forces pending review", () => {
  const context = chooseDuplicateContext([userUpload]);
  const metadata = duplicateMetadata(context.reviewDuplicate);
  const reviewState = uploadReviewState({
    isUploaderAdmin: false,
    hasReviewDuplicate: Boolean(context.reviewDuplicate),
  });

  assert.equal(context.publicDuplicate, undefined);
  assert.equal(canApprovePdf({ publicDuplicate: context.publicDuplicate }).ok, true);
  assert.equal(reviewState.status, "pending");
  assert.equal(metadata.duplicateSourceStatus, "pending");
  assert.equal(metadata.duplicateSourceSubmittedByName, "rayan");
  assert.equal(metadata.duplicateSourceSubmittedByRole, "user");
});

test("deleted full-library duplicate is allowed and records deleter", () => {
  const context = chooseDuplicateContext([adminDeletedUpload]);
  const metadata = duplicateMetadata(context.reviewDuplicate);
  const reviewState = uploadReviewState({
    isUploaderAdmin: true,
    hasReviewDuplicate: Boolean(context.reviewDuplicate),
  });

  assert.equal(context.publicDuplicate, undefined);
  assert.equal(reviewState.status, "pending");
  assert.equal(reviewState.shouldAutoApprove, false);
  assert.equal(metadata.duplicateSourceStatus, "full library");
  assert.equal(metadata.duplicateSourceSubmittedByName, "adminUploader");
  assert.equal(metadata.duplicateSourceSubmittedByRole, "admin");
  assert.equal(metadata.duplicateSourceDeletedByName, "mainAdmin");
  assert.equal(metadata.duplicateSourceDeletedByRole, "admin");
});

test("admin upload without duplicate auto-approves", () => {
  const reviewState = uploadReviewState({
    isUploaderAdmin: true,
    hasReviewDuplicate: false,
  });

  assert.deepEqual(reviewState, {
    status: "approved",
    shouldAutoApprove: true,
    reviewComment: "Auto-approved: uploaded by admin",
  });
});

test("soft delete keeps library history with reviewer and reason", () => {
  assert.deepEqual(
    softDeleteHistoryUpdate({
      reviewerId: "admin-id",
      reason: " wrong paper ",
    }),
    {
      status: "deleted",
      reviewedBy: "admin-id",
      reviewComment: "wrong paper",
    },
  );
});

test("only approved PDFs are downloadable", () => {
  assert.equal(canDownloadPdf({ status: "approved" }), true);
  assert.equal(canDownloadPdf({ status: "pending" }), false);
  assert.equal(canDownloadPdf({ status: "rejected" }), false);
  assert.equal(canDownloadPdf({ status: "deleted" }), false);
  assert.equal(canDownloadPdf(null), false);
});
