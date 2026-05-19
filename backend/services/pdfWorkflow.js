const PUBLIC_DUPLICATE_MESSAGE =
  "This file is already uploaded and present publicly.";

const duplicateQueryFor = ({
  title,
  college,
  course,
  semester,
  year,
  fileHash,
}) => {
  const metadataQuery = {
    title,
    college,
    course,
    semester,
    year: Number(year),
  };

  if (!fileHash) {
    return metadataQuery;
  }

  return {
    $or: [metadataQuery, { fileHash }],
  };
};

const chooseDuplicateContext = (duplicates = []) => {
  const publicDuplicate = duplicates.find((pdf) => pdf.status === "approved");
  const reviewDuplicate =
    duplicates.find((pdf) => pdf.status === "pending") ||
    duplicates.find((pdf) => ["deleted", "rejected"].includes(pdf.status));

  return { publicDuplicate, reviewDuplicate };
};

const duplicateMetadata = (pdf) => {
  if (!pdf) return {};

  const submittedBy = pdf.submittedBy;
  const submittedByName = submittedBy?.username || pdf.submittedByName;
  const submittedByRole = submittedBy?.role || "user";
  const deletedBy = pdf.reviewedBy;
  const deletedByName = deletedBy?.username;
  const deletedByRole = deletedBy?.role;
  const sourceStatus = pdf.status === "pending" ? "pending" : "full library";

  return {
    duplicateOf: pdf._id,
    duplicateSourceStatus: sourceStatus,
    duplicateSourceSubmittedByName: submittedByName,
    duplicateSourceSubmittedByRole: submittedByRole,
    duplicateSourceDeletedByName:
      pdf.status === "deleted" ? deletedByName : undefined,
    duplicateSourceDeletedByRole:
      pdf.status === "deleted" ? deletedByRole : undefined,
  };
};

const uploadReviewState = ({ isUploaderAdmin, hasReviewDuplicate }) => {
  const autoApprove = isUploaderAdmin && !hasReviewDuplicate;

  return {
    status: autoApprove ? "approved" : "pending",
    shouldAutoApprove: autoApprove,
    reviewComment: autoApprove ? "Auto-approved: uploaded by admin" : "",
  };
};

const canApprovePdf = ({ publicDuplicate }) => {
  if (!publicDuplicate) {
    return { ok: true };
  }

  return {
    ok: false,
    message: PUBLIC_DUPLICATE_MESSAGE,
    existingPdf: publicDuplicate.url,
  };
};

const canDownloadPdf = (pdf) => Boolean(pdf && pdf.status === "approved");

const softDeleteHistoryUpdate = ({ reviewerId, reason }) => ({
  status: "deleted",
  reviewedBy: reviewerId,
  reviewComment: reason.trim(),
});

module.exports = {
  PUBLIC_DUPLICATE_MESSAGE,
  canApprovePdf,
  canDownloadPdf,
  chooseDuplicateContext,
  duplicateMetadata,
  duplicateQueryFor,
  softDeleteHistoryUpdate,
  uploadReviewState,
};
