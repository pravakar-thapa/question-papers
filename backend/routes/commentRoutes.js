const express = require("express");
const {
  addComment,
  addNestedReply,
  addReply,
  deleteComment,
  deleteNestedReply,
  deleteReply,
  dislikeComment,
  editComment,
  editCommentByPdfId,
  editNestedReply,
  editReply,
  likeComment,
} = require("../controllers/commentController");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.post("/pdf/:id/comment", verifyToken, addComment);
router.put("/pdf/:pdfId/comment/:commentIndex", verifyToken, editCommentByPdfId);
router.post("/pdf/:pdfId/comment/:commentIndex/reply", verifyToken, addReply);
router.put(
  "/pdf/:pdfId/comment/:commentIndex/reply/:replyIndex",
  verifyToken,
  editReply,
);
router.delete(
  "/pdf/:pdfId/comment/:commentIndex/reply/:replyIndex",
  verifyToken,
  deleteReply,
);
router.post(
  "/pdf/:pdfId/comment/:commentIndex/reply/:replyIndex/reply",
  verifyToken,
  addNestedReply,
);
router.put(
  "/pdf/:pdfId/comment/:commentIndex/reply/:replyIndex/nested/:nestedIndex",
  verifyToken,
  editNestedReply,
);
router.delete(
  "/pdf/:pdfId/comment/:commentIndex/reply/:replyIndex/nested/:nestedIndex",
  verifyToken,
  deleteNestedReply,
);
router.patch("/pdf/:pdfId/comment/:commentIndex/like", verifyToken, likeComment);
router.patch(
  "/pdf/:pdfId/comment/:commentIndex/dislike",
  verifyToken,
  dislikeComment,
);
router.put("/pdf/:id/comment/:index", verifyToken, editComment);
router.delete("/pdf/:id/comment/:index", verifyToken, deleteComment);

module.exports = router;
