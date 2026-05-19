const PDF = require("../models/PDF");
const { areObjectIdsEqual } = require("../utils/validators");
const { sanitizeCommentText } = require("../utils/sanitize");

const requireApprovedPdf = (pdf, res) => {
  if (pdf.status === "approved") {
    return true;
  }

  res.status(403).json({ message: "Only approved PDFs can be discussed" });
  return false;
};

const addComment = async (req, res) => {
  try {
    const text = sanitizeCommentText(req.body.text);

    if (!text) {
      return res.status(400).json({ message: "Comment required" });
    }

    const pdf = await PDF.findById(req.params.id);
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }
    if (!requireApprovedPdf(pdf, res)) return;

    pdf.comments.push({
      userId: req.user.userId,
      username: req.user.username,
      role: req.user.role,
      text,
    });
    await pdf.save();

    res.json({
      message: "Comment added",
      comments: pdf.comments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not add comment" });
  }
};

const editCommentByPdfId = async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.pdfId);
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }
    if (!requireApprovedPdf(pdf, res)) return;

    const comment = pdf.comments[req.params.commentIndex];
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!areObjectIdsEqual(comment.userId, req.user.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const text = sanitizeCommentText(req.body.text);
    if (!text) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    comment.text = text;
    comment.edited = true;
    await pdf.save();

    res.json({ comments: pdf.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Edit failed" });
  }
};

const editComment = async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }
    if (!requireApprovedPdf(pdf, res)) return;

    const comment = pdf.comments[req.params.index];
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!areObjectIdsEqual(comment.userId, req.user.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const text = sanitizeCommentText(req.body.text);
    if (!text) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    comment.text = text;
    comment.edited = true;

    await pdf.save();
    res.json({ comments: pdf.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Edit failed" });
  }
};

const deleteComment = async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }
    if (!requireApprovedPdf(pdf, res)) return;

    const comment = pdf.comments[req.params.index];
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!areObjectIdsEqual(comment.userId, req.user.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    comment.isDeleted = true;
    comment.text = "[deleted]";

    await pdf.save();
    res.json({ comments: pdf.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
};

const addReply = async (req, res) => {
  try {
    const text = sanitizeCommentText(req.body.text);

    if (!text) {
      return res.status(400).json({ message: "Reply cannot be empty" });
    }

    const pdf = await PDF.findById(req.params.pdfId);
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }
    if (!requireApprovedPdf(pdf, res)) return;

    const comment = pdf.comments[req.params.commentIndex];
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!comment.replies) {
      comment.replies = [];
    }

    comment.replies.push({
      userId: req.user.userId,
      username: req.user.username,
      role: req.user.role,
      text,
    });

    await pdf.save();

    res.json({
      message: "Reply added",
      comments: pdf.comments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reply failed" });
  }
};

const editReply = async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.pdfId);
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }
    if (!requireApprovedPdf(pdf, res)) return;

    const comment = pdf.comments[req.params.commentIndex];
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const reply = comment.replies[req.params.replyIndex];

    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    if (!areObjectIdsEqual(reply.userId, req.user.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    const text = sanitizeCommentText(req.body.text);
    if (!text) {
      return res.status(400).json({ message: "Reply cannot be empty" });
    }
    reply.text = text;
    reply.edited = true;

    await pdf.save();

    res.json({ comments: pdf.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reply edit failed" });
  }
};

const deleteReply = async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.pdfId);
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }
    if (!requireApprovedPdf(pdf, res)) return;

    const comment = pdf.comments[req.params.commentIndex];
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const replies = comment.replies;
    const reply = replies[req.params.replyIndex];

    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    if (!areObjectIdsEqual(reply.userId, req.user.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    reply.isDeleted = true;
    reply.text = "[deleted]";

    await pdf.save();

    res.json({ comments: pdf.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reply delete failed" });
  }
};

const addNestedReply = async (req, res) => {
  try {
    const text = sanitizeCommentText(req.body.text);

    if (!text) {
      return res.status(400).json({ message: "Reply cannot be empty" });
    }

    const pdf = await PDF.findById(req.params.pdfId);
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }
    if (!requireApprovedPdf(pdf, res)) return;

    const comment = pdf.comments[req.params.commentIndex];
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const parentReply = comment.replies[req.params.replyIndex];
    if (!parentReply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    if (!parentReply.replies) {
      parentReply.replies = [];
    }

    parentReply.replies.push({
      userId: req.user.userId,
      username: req.user.username,
      role: req.user.role,
      text,
    });

    await pdf.save();

    res.json({
      message: "Nested reply added",
      comments: pdf.comments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Nested reply failed" });
  }
};

const editNestedReply = async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.pdfId);
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }
    if (!requireApprovedPdf(pdf, res)) return;

    const comment = pdf.comments[req.params.commentIndex];
    const reply = comment?.replies[req.params.replyIndex];
    const nestedReply = reply?.replies[req.params.nestedIndex];

    if (!nestedReply) {
      return res.status(404).json({ message: "Nested reply not found" });
    }

    if (!areObjectIdsEqual(nestedReply.userId, req.user.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }
    const text = sanitizeCommentText(req.body.text);
    if (!text) {
      return res.status(400).json({ message: "Reply cannot be empty" });
    }
    nestedReply.text = text;
    nestedReply.edited = true;

    await pdf.save();

    res.json({ comments: pdf.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Nested edit failed" });
  }
};

const deleteNestedReply = async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.pdfId);
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }
    if (!requireApprovedPdf(pdf, res)) return;

    const comment = pdf.comments[req.params.commentIndex];
    const reply = comment?.replies[req.params.replyIndex];
    const nestedReplies = reply?.replies;

    const nestedReply = nestedReplies?.[req.params.nestedIndex];
    if (!nestedReply) {
      return res.status(404).json({ message: "Nested reply not found" });
    }

    if (!areObjectIdsEqual(nestedReply.userId, req.user.userId)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    nestedReply.isDeleted = true;
    nestedReply.text = "[deleted]";

    await pdf.save();

    res.json({ comments: pdf.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Nested delete failed" });
  }
};

const likeComment = async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.pdfId);
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }
    if (!requireApprovedPdf(pdf, res)) return;

    const comment = pdf.comments[req.params.commentIndex];
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const userId = req.user.userId;
    const alreadyLiked = comment.likedBy.includes(userId);
    const alreadyDisliked = comment.dislikedBy.includes(userId);

    if (alreadyLiked) {
      comment.likedBy = comment.likedBy.filter((id) => id !== userId);
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
      comment.likedBy.push(userId);
      comment.likes += 1;

      if (alreadyDisliked) {
        comment.dislikedBy = comment.dislikedBy.filter((id) => id !== userId);
        comment.dislikes = Math.max(0, comment.dislikes - 1);
      }
    }

    await pdf.save();
    res.json({ comments: pdf.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Like failed" });
  }
};

const dislikeComment = async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.pdfId);
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }
    if (!requireApprovedPdf(pdf, res)) return;

    const comment = pdf.comments[req.params.commentIndex];
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const userId = req.user.userId;
    const alreadyLiked = comment.likedBy.includes(userId);
    const alreadyDisliked = comment.dislikedBy.includes(userId);

    if (alreadyDisliked) {
      comment.dislikedBy = comment.dislikedBy.filter((id) => id !== userId);
      comment.dislikes = Math.max(0, comment.dislikes - 1);
    } else {
      comment.dislikedBy.push(userId);
      comment.dislikes += 1;

      if (alreadyLiked) {
        comment.likedBy = comment.likedBy.filter((id) => id !== userId);
        comment.likes = Math.max(0, comment.likes - 1);
      }
    }

    await pdf.save();
    res.json({ comments: pdf.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Dislike failed" });
  }
};

module.exports = {
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
};
