const express = require("express");
const {
  bulkDeletePdfs,
  deleteAllPdfs,
  deleteUser,
  getAllPdfs,
  getAllUsers,
  getAuditLogs,
  getPendingPdfs,
  getStats,
  reviewPdf,
  restorePdf,
  resetUserPassword,
  updateUserBan,
  updateUserRole,
} = require("../controllers/adminController");
const { verifyAdmin, verifyToken } = require("../middleware/auth");
const { asyncHandler } = require("../utils/responses");

const router = express.Router();

router.patch(
  "/pdf/:id/status",
  verifyToken,
  verifyAdmin,
  asyncHandler(reviewPdf),
);
router.patch(
  "/pdf/:id/restore",
  verifyToken,
  verifyAdmin,
  asyncHandler(restorePdf),
);
router.get(
  "/pending-pdfs",
  verifyToken,
  verifyAdmin,
  asyncHandler(getPendingPdfs),
);
router.get("/admin/all-pdfs", verifyToken, verifyAdmin, asyncHandler(getAllPdfs));
router.get(
  "/admin/audit-logs",
  verifyToken,
  verifyAdmin,
  asyncHandler(getAuditLogs),
);
router.get("/admin/users", verifyToken, verifyAdmin, asyncHandler(getAllUsers));
router.patch(
  "/admin/users/:id/role",
  verifyToken,
  verifyAdmin,
  asyncHandler(updateUserRole),
);
router.patch(
  "/admin/users/:id/ban",
  verifyToken,
  verifyAdmin,
  asyncHandler(updateUserBan),
);
router.patch(
  "/admin/users/:id/password",
  verifyToken,
  verifyAdmin,
  asyncHandler(resetUserPassword),
);
router.delete(
  "/admin/users/:id",
  verifyToken,
  verifyAdmin,
  asyncHandler(deleteUser),
);
router.delete("/pdf/all", verifyToken, verifyAdmin, asyncHandler(deleteAllPdfs));
router.post(
  "/pdf/bulk-delete",
  verifyToken,
  verifyAdmin,
  asyncHandler(bulkDeletePdfs),
);
router.get("/admin/stats", verifyToken, verifyAdmin, asyncHandler(getStats));

module.exports = router;
