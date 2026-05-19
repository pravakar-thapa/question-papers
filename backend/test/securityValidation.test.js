const assert = require("node:assert/strict");
const test = require("node:test");

const { buildPdfQuery } = require("../utils/query");
const {
  sanitizeCommentText,
  sanitizePdfMetadata,
} = require("../utils/sanitize");
const { createFileHash } = require("../utils/fileHash");
const {
  validatePdfMetadata,
  validatePdfUpload,
} = require("../utils/validators");

test("PDF metadata is sanitized before validation", () => {
  const metadata = sanitizePdfMetadata({
    title: "  Data\u0000 Structures  ",
    college: "  ABC   College ",
    course: " BCA ",
    semester: " 4 ",
    year: "2025",
  });

  assert.deepEqual(metadata, {
    title: "data structures",
    college: "abc college",
    course: "bca",
    semester: "4",
    year: 2025,
  });
  assert.equal(validatePdfMetadata(metadata), null);
});

test("PDF upload validation checks extension, mime type, size and signature", () => {
  const validPdf = {
    originalname: "paper.pdf",
    mimetype: "application/pdf",
    size: 1024,
    buffer: Buffer.from("%PDF-1.7\nbody"),
  };

  assert.equal(validatePdfUpload(validPdf), null);
  assert.equal(
    validatePdfUpload({ ...validPdf, buffer: Buffer.from("not a pdf") }),
    "Only valid PDF files are allowed",
  );
  assert.equal(
    validatePdfUpload({ ...validPdf, originalname: "paper.txt" }),
    "Only valid PDF files are allowed",
  );
});

test("public PDF queries always require approved status and escape regex input", () => {
  assert.deepEqual(buildPdfQuery({ title: "math.*" }), {
    status: "approved",
    title: { $regex: "math\\.\\*", $options: "i" },
  });
});

test("comment text sanitizer removes controls, collapses spaces, and caps length", () => {
  const sanitized = sanitizeCommentText(` hello\u0000   world ${"x".repeat(1200)}`);

  assert.equal(sanitized.startsWith("hello world"), true);
  assert.equal(sanitized.length, 1000);
});

test("file hashing is stable for identical content and changes with bytes", () => {
  assert.equal(
    createFileHash(Buffer.from("same")),
    createFileHash(Buffer.from("same")),
  );
  assert.notEqual(
    createFileHash(Buffer.from("same")),
    createFileHash(Buffer.from("different")),
  );
});
