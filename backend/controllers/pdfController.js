const archiver = require("archiver");
const axios = require("axios");
const PDF = require("../models/PDF");
const {
  canApprovePdf,
  canDownloadPdf,
  duplicateMetadata,
  duplicateQueryFor,
  uploadReviewState,
} = require("../services/pdfWorkflow");
const {
  buildPdfQuery,
  parsePagination,
} = require("../utils/query");
const {
  areObjectIdsEqual,
  MAX_OPTIMIZED_PDF_SIZE,
  isValidObjectId,
  validatePdfMetadata,
  validatePdfUpload,
} = require("../utils/validators");
const {
  sanitizePdfMetadata,
  sanitizeReviewComment,
} = require("../utils/sanitize");
const { createFileHash } = require("../utils/fileHash");
const { sendError, sendResponse } = require("../utils/responses");
const { AUDIT_ACTIONS, logAuditEvent } = require("../services/auditService");
const {
  adjustContributionForStatusChange,
} = require("../services/userService");
const {
  deletePdfDocument,
  findDuplicateContext,
  optimizePdf,
  replacePdfFile,
  softDeletePdfForLibrary,
  uploadPdfBuffer,
} = require("../services/pdfService");

const preparePdfBuffer = async (file) => {
  let fileBuffer = file.buffer;

  if (file.size > MAX_OPTIMIZED_PDF_SIZE) {
    console.log("Optimizing large PDF...");
    fileBuffer = await optimizePdf(file.buffer);
    console.log(
      `Optimized PDF size: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB`,
    );

    if (fileBuffer.length > MAX_OPTIMIZED_PDF_SIZE) {
      return {
        error:
          "PDF could not be optimized below 10MB. Please upload a smaller file.",
      };
    }
  }

  return { fileBuffer };
};

const uploadPdf = async (req, res) => {
  try {
    const metadata = sanitizePdfMetadata(req.body);
    const metadataError = validatePdfMetadata(metadata);
    if (metadataError) {
      return res.status(400).json({ message: metadataError });
    }

    const { title, college, course, semester, year } = metadata;
    const file = req.file;
    const uploadError = validatePdfUpload(file);
    if (uploadError) {
      return res.status(400).json({ message: uploadError });
    }

    const fileHash = createFileHash(file.buffer);
    const { fileBuffer, error: fileBufferError } = await preparePdfBuffer(file);
    if (fileBufferError) {
      return res.status(400).json({ message: fileBufferError });
    }

    const duplicateQuery = duplicateQueryFor({
      title,
      college,
      course,
      semester,
      year,
      fileHash,
    });
    const { publicDuplicate, reviewDuplicate } =
      await findDuplicateContext(duplicateQuery);

    const approvalCheck = canApprovePdf({ publicDuplicate });
    if (!approvalCheck.ok) {
      return res.status(400).json({
        message: approvalCheck.message,
        existingPdf: approvalCheck.existingPdf,
      });
    }

    const duplicateInfo = duplicateMetadata(reviewDuplicate);
    const uploadResult = await uploadPdfBuffer(fileBuffer);

    const uploadAsUserHeader = String(req.headers["x-upload-as-user"] || "")
      .toLowerCase();
    const actAsUser =
      uploadAsUserHeader === "1" || uploadAsUserHeader === "true";
    const isUploaderAdmin = req.user.role === "admin" && !actAsUser;
    const reviewState = uploadReviewState({
      isUploaderAdmin,
      hasReviewDuplicate: Boolean(reviewDuplicate),
    });

    const createdPdf = await PDF.create({
      title,
      college,
      course,
      semester,
      year,
      fileHash,
      url: uploadResult.secure_url,
      cloudinaryId: uploadResult.public_id,
      submittedBy: req.user.userId,
      submittedByName: req.user.username,
      status: reviewState.status,
      reviewedBy: reviewState.shouldAutoApprove ? req.user.userId : undefined,
      reviewComment: reviewState.reviewComment,
      editedAfterReview: false,
      ...duplicateInfo,
    });

    await logAuditEvent({
      action: AUDIT_ACTIONS.UPLOADED,
      actor: req.user,
      pdf: createdPdf,
      statusTo: createdPdf.status,
      metadata: {
        duplicate: Boolean(reviewDuplicate),
        duplicateOf: duplicateInfo.duplicateOf,
      },
      req,
    });

    if (reviewState.shouldAutoApprove) {
      await adjustContributionForStatusChange({
        submittedBy: createdPdf.submittedBy,
        statusFrom: undefined,
        statusTo: createdPdf.status,
      });
      await logAuditEvent({
        action: AUDIT_ACTIONS.APPROVED,
        actor: req.user,
        pdf: createdPdf,
        statusTo: "approved",
        reason: reviewState.reviewComment,
        metadata: { automatic: true },
        req,
      });
    }

    sendResponse(res, "Upload completed", {
      url: uploadResult.secure_url,
      pdf: createdPdf,
      duplicate: Boolean(reviewDuplicate),
      duplicateSourceStatus: duplicateInfo.duplicateSourceStatus,
    });
  } catch (error) {
    sendError(res, 500, "Upload failed", {
      error: error.message || error,
    });
  }
};

const getPdfs = async (req, res) => {
  const { sort } = req.query;
  const query = buildPdfQuery(req.query);

  let sortQuery = { createdAt: -1 };
  if (sort === "popular") {
    sortQuery = { downloads: -1 };
  }

  const {
    page: currentPage,
    limit: pageSize,
    skip,
  } = parsePagination(req.query);

  const [total, pdfs] = await Promise.all([
    PDF.countDocuments(query),
    PDF.find(query).sort(sortQuery).skip(skip).limit(pageSize).lean(),
  ]);

  sendResponse(res, "PDFs retrieved", {
    pdfs,
    pagination: {
      total,
      page: currentPage,
      pageSize,
      pages: Math.ceil(total / pageSize),
    },
  });
};

const downloadPdf = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid PDF id" });
    }

    const pdf = await PDF.findById(req.params.id);
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    if (!canDownloadPdf(pdf)) {
      return res.status(403).json({
        message: "Only approved PDFs can be downloaded",
      });
    }

    pdf.downloads += 1;
    await pdf.save();

    res.redirect(`${pdf.url}?fl_attachment=true`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Download failed" });
  }
};

const downloadAllPdfs = async (req, res) => {
  try {
    const { title, college, course, semester, year } = req.query;
    const pdfs = await PDF.find(
      buildPdfQuery({ title, college, course, semester, year }),
    );

    if (pdfs.length === 0) {
      return res.status(404).send("No PDFs found");
    }

    const archive = archiver("zip", { zlib: { level: 9 } });
    res.attachment("pdfs.zip");
    archive.pipe(res);

    await Promise.all(
      pdfs.map(async (pdf) => {
        const response = await axios({
          method: "GET",
          url: pdf.url,
          responseType: "stream",
        });

        archive.append(response.data, {
          name: `${pdf.title.replace(/\s+/g, "_")}_${pdf.college.replace(/\s+/g, "_")}_${pdf.course.replace(/\s+/g, "_")}_sem${pdf.semester}_${pdf.year}.pdf`,
        });
      }),
    );

    await archive.finalize();
  } catch (err) {
    console.log(err);
    res.status(500).send("Error downloading PDFs");
  }
};

const updatePdf = async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    if (
      !areObjectIdsEqual(pdf.submittedBy, req.user.userId) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const metadata = sanitizePdfMetadata({ ...pdf.toObject(), ...req.body });
    const metadataError = validatePdfMetadata(metadata);
    if (metadataError) {
      return res.status(400).json({ message: metadataError });
    }

    const previousStatus = pdf.status;
    const previousMetadata = {
      title: pdf.title,
      college: pdf.college,
      course: pdf.course,
      semester: pdf.semester,
      year: pdf.year,
      fileHash: pdf.fileHash,
    };

    Object.assign(pdf, metadata);

    let fileHash = pdf.fileHash;
    let replacementBuffer;

    if (
      areObjectIdsEqual(pdf.submittedBy, req.user.userId) &&
      ["approved", "rejected"].includes(pdf.status)
    ) {
      pdf.status = "pending";
      pdf.reviewComment = "";
      pdf.reviewedBy = undefined;
      pdf.editedAfterReview = true;
    }

    if (req.file) {
      const uploadError = validatePdfUpload(req.file);
      if (uploadError) {
        return res.status(400).json({ message: uploadError });
      }
      const { fileBuffer, error: fileBufferError } = await preparePdfBuffer(
        req.file,
      );
      if (fileBufferError) {
        return res.status(400).json({ message: fileBufferError });
      }
      fileHash = createFileHash(req.file.buffer);
      replacementBuffer = fileBuffer;
    }

    const duplicateQuery = duplicateQueryFor({ ...metadata, fileHash });
    const { publicDuplicate, reviewDuplicate } = await findDuplicateContext({
      ...duplicateQuery,
      _id: { $ne: pdf._id },
    });

    const approvalCheck = canApprovePdf({ publicDuplicate });
    if (!approvalCheck.ok) {
      return res.status(400).json({
        message: approvalCheck.message,
        existingPdf: approvalCheck.existingPdf,
      });
    }

    pdf.duplicateOf = undefined;
    pdf.duplicateSourceStatus = undefined;
    pdf.duplicateSourceSubmittedByName = undefined;
    pdf.duplicateSourceSubmittedByRole = undefined;
    pdf.duplicateSourceDeletedByName = undefined;
    pdf.duplicateSourceDeletedByRole = undefined;
    Object.assign(pdf, duplicateMetadata(reviewDuplicate));

    if (replacementBuffer) {
      await replacePdfFile(pdf, replacementBuffer, fileHash);
    } else {
      pdf.fileHash = fileHash;
    }

    await pdf.save();
    await adjustContributionForStatusChange({
      submittedBy: pdf.submittedBy,
      statusFrom: previousStatus,
      statusTo: pdf.status,
    });

    await logAuditEvent({
      action: AUDIT_ACTIONS.EDITED,
      actor: req.user,
      pdf,
      statusFrom: previousStatus,
      statusTo: pdf.status,
      metadata: {
        before: previousMetadata,
        fileReplaced: Boolean(replacementBuffer),
      },
      req,
    });

    res.json({
      message: "PDF updated successfully",
      pdf,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
};

const deletePdf = async (req, res) => {
  const pdf = await PDF.findById(req.params.id);

  if (!pdf) {
    return sendError(res, 404, "PDF not found");
  }

  if (
    !areObjectIdsEqual(pdf.submittedBy, req.user.userId) &&
    req.user.role !== "admin"
  ) {
    return sendError(res, 403, "Access denied");
  }

  if (req.user.role === "admin" && req.body?.permanent === true) {
    await logAuditEvent({
      action: AUDIT_ACTIONS.DELETED,
      actor: req.user,
      pdf,
      statusFrom: pdf.status,
      reason: "Permanent delete",
      metadata: { permanent: true },
      req,
    });
    await adjustContributionForStatusChange({
      submittedBy: pdf.submittedBy,
      statusFrom: pdf.status,
      statusTo: undefined,
    });
    await deletePdfDocument(pdf);
    return sendResponse(res, "Permanently deleted successfully");
  }

  const reason = sanitizeReviewComment(req.body?.reviewComment);

  if (!reason) {
    return sendError(res, 400, "Deletion reason is required");
  }

  const previousStatus = pdf.status;
  await softDeletePdfForLibrary(pdf, req.user.userId, reason);
  await adjustContributionForStatusChange({
    submittedBy: pdf.submittedBy,
    statusFrom: previousStatus,
    statusTo: pdf.status,
  });
  await logAuditEvent({
    action: AUDIT_ACTIONS.DELETED,
    actor: req.user,
    pdf,
    statusFrom: previousStatus,
    statusTo: pdf.status,
    reason,
    metadata: { permanent: false },
    req,
  });
  sendResponse(res, "PDF removed from uploads and kept in library history", {
    pdf,
  });
};

module.exports = {
  deletePdf,
  downloadAllPdfs,
  downloadPdf,
  getPdfs,
  updatePdf,
  uploadPdf,
};
