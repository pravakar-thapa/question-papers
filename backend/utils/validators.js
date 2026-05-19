const mongoose = require("mongoose");

const MAX_PDF_UPLOAD_SIZE = 20 * 1024 * 1024;
const MAX_OPTIMIZED_PDF_SIZE = 10 * 1024 * 1024;
const PDF_SIGNATURE = "%PDF-";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeObjectId = (value) => {
  if (!value) {
    return "";
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === "string") {
    return value;
  }

  if (value._id && value._id !== value) {
    return normalizeObjectId(value._id);
  }

  if (value.id && typeof value.id !== "function" && value.id !== value) {
    return normalizeObjectId(value.id);
  }

  return value.toString();
};

const areObjectIdsEqual = (left, right) =>
  normalizeObjectId(left) === normalizeObjectId(right);

const validatePdfMetadata = ({ title, college, course, semester, year }) => {
  const nameRegex = /^[a-z0-9][a-z0-9 .,&()/-]{2,119}$/i;
  const courseRegex = /^[a-z0-9][a-z0-9 .,&()/-]{1,79}$/i;
  const semesterRegex = /^[0-9]{1,2}$/;
  const currentYear = new Date().getFullYear();

  if (!title || !college || !course || !semester || !year) {
    return "All fields required";
  }
  if (!nameRegex.test(title)) {
    return "Invalid title";
  }
  if (!nameRegex.test(college)) {
    return "Invalid college";
  }
  if (!courseRegex.test(course)) {
    return "Invalid course";
  }
  if (!semesterRegex.test(semester) || Number(semester) < 1 || Number(semester) > 12) {
    return "Invalid semester";
  }
  if (!Number.isInteger(year) || year < 2000 || year > currentYear) {
    return "Invalid year";
  }

  return null;
};

const validatePdfUpload = (file) => {
  if (!file) {
    return "No file uploaded";
  }

  const isPdfMime = file.mimetype === "application/pdf";
  const isPdfExt = file.originalname?.toLowerCase().endsWith(".pdf");
  const hasPdfSignature = file.buffer
    ?.subarray(0, PDF_SIGNATURE.length)
    .toString("utf8") === PDF_SIGNATURE;

  if (!isPdfMime || !isPdfExt || !hasPdfSignature) {
    return "Only valid PDF files are allowed";
  }
  if (file.size > MAX_PDF_UPLOAD_SIZE) {
    return "PDF too large. Maximum allowed size is 20MB";
  }

  return null;
};

module.exports = {
  areObjectIdsEqual,
  MAX_OPTIMIZED_PDF_SIZE,
  MAX_PDF_UPLOAD_SIZE,
  isValidObjectId,
  validatePdfMetadata,
  validatePdfUpload,
};
