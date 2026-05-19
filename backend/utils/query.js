const { collapseWhitespace, escapeRegex } = require("./sanitize");

const buildPdfQuery = ({ title, college, course, semester, year }) => {
  const query = { status: "approved" };

  if (title) {
    query.title = {
      $regex: escapeRegex(collapseWhitespace(title)),
      $options: "i",
    };
  }
  if (college) {
    query.college = {
      $regex: escapeRegex(collapseWhitespace(college)),
      $options: "i",
    };
  }
  if (course) {
    query.course = {
      $regex: escapeRegex(collapseWhitespace(course)),
      $options: "i",
    };
  }
  if (semester) {
    query.semester = collapseWhitespace(semester);
  }
  if (year) {
    const yearNumber = Number(year);
    if (!Number.isNaN(yearNumber)) query.year = yearNumber;
  }

  return query;
};

const parsePagination = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
  return { page, limit, skip: (page - 1) * limit };
};

module.exports = {
  buildPdfQuery,
  parsePagination,
};
