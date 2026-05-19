const express = require("express");
const {
  deletePdf,
  downloadAllPdfs,
  downloadPdf,
  getPdfs,
  updatePdf,
  uploadPdf,
} = require("../controllers/pdfController");
const { verifyToken } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { asyncHandler } = require("../utils/responses");

const router = express.Router();

router.post("/upload", verifyToken, upload.single("pdf"), asyncHandler(uploadPdf));
router.get("/pdfs", asyncHandler(getPdfs));
router.get("/download-all", verifyToken, asyncHandler(downloadAllPdfs));
router.get("/download/:id", asyncHandler(downloadPdf));
router.put("/pdf/:id", verifyToken, upload.single("pdf"), asyncHandler(updatePdf));
router.delete("/pdf/:id", verifyToken, asyncHandler(deletePdf));

module.exports = router;
