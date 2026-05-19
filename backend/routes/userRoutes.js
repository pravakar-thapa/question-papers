const express = require("express");
const {
  cancelAccountDeletion,
  changeMyPassword,
  getMyAccount,
  getMyUploads,
  getSavedPdfs,
  requestAccountDeletion,
  toggleSavedPdf,
} = require("../controllers/userController");
const { verifyToken } = require("../middleware/auth");
const { asyncHandler } = require("../utils/responses");

const router = express.Router();

router.get("/me", verifyToken, asyncHandler(getMyAccount));
router.patch("/me/password", verifyToken, asyncHandler(changeMyPassword));
router.delete("/me", verifyToken, asyncHandler(requestAccountDeletion));
router.patch(
  "/me/deletion-request",
  verifyToken,
  asyncHandler(cancelAccountDeletion),
);
router.post("/save/:pdfId", verifyToken, asyncHandler(toggleSavedPdf));
router.get("/my-uploads", verifyToken, asyncHandler(getMyUploads));
router.get("/saved-pdfs", verifyToken, asyncHandler(getSavedPdfs));

module.exports = router;
