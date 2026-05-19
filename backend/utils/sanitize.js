const collapseWhitespace = (value) =>
  String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sanitizeCommentText = (value) => collapseWhitespace(value).slice(0, 1000);

const sanitizeReviewComment = (value) => collapseWhitespace(value).slice(0, 500);

const sanitizePdfMetadata = (body = {}) => ({
  title: collapseWhitespace(body.title).toLowerCase(),
  college: collapseWhitespace(body.college).toLowerCase(),
  course: collapseWhitespace(body.course).toLowerCase(),
  semester: collapseWhitespace(body.semester),
  year: Number(body.year),
});

module.exports = {
  collapseWhitespace,
  escapeRegex,
  sanitizeCommentText,
  sanitizePdfMetadata,
  sanitizeReviewComment,
};
