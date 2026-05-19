const multer = require("multer");

const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "PDF must be 20MB or smaller" });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err && err.message === "Only PDF files are allowed") {
    return res.status(400).json({ message: err.message });
  }

  next(err);
};

const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate record already exists",
    });
  }
  const status = err.statusCode || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ success: false, message });
};

module.exports = {
  errorHandler,
  multerErrorHandler,
};
