const multer = require("multer");
const { MAX_PDF_UPLOAD_SIZE } = require("../utils/validators");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_PDF_UPLOAD_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    const isPdfMime = file.mimetype === "application/pdf";
    const isPdfExt = file.originalname.toLowerCase().endsWith(".pdf");

    if (!isPdfMime || !isPdfExt) {
      return cb(new Error("Only PDF files are allowed"));
    }

    cb(null, true);
  },
});

module.exports = upload;
