const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const sendResponse = (res, message = "", data = {}) =>
  res.json({ success: true, message, data });

const sendError = (res, status, message = "Unexpected error", data = {}) =>
  res.status(status).json({ success: false, message, data });

module.exports = {
  asyncHandler,
  sendError,
  sendResponse,
};
