const mongoose = require("mongoose");

const nestedReplySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: String,
    text: String,
    role: String,
    isDeleted: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
  },
  { timestamps: true, _id: true },
);

const replySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: String,
    text: String,
    role: String,
    isDeleted: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    likedBy: [{ type: String }],
    dislikedBy: [{ type: String }],
    replies: [nestedReplySchema],
  },
  { timestamps: true, _id: true },
);

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: String,
    text: String,
    role: String,
    isDeleted: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    likedBy: [{ type: String }],
    dislikedBy: [{ type: String }],
    replies: [replySchema],
  },
  { timestamps: true, _id: true },
);

const pdfSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, lowercase: true },
    college: { type: String, required: true, trim: true, lowercase: true },
    course: { type: String, required: true, trim: true, lowercase: true },
    semester: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    url: { type: String, required: true },
    cloudinaryId: { type: String, required: true },
    fileHash: { type: String, trim: true, index: true },
    downloads: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "deleted"],
      default: "pending",
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    submittedByName: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewComment: String,
    editedAfterReview: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: "PDF" },
    duplicateSourceStatus: String,
    duplicateSourceSubmittedByName: String,
    duplicateSourceSubmittedByRole: String,
    duplicateSourceDeletedByName: String,
    duplicateSourceDeletedByRole: String,
    comments: [commentSchema],
  },
  { timestamps: true },
);

pdfSchema.index({ title: "text", college: "text", course: "text" });
pdfSchema.index({ semester: 1, year: 1, status: 1 });
pdfSchema.index({ downloads: -1 });
pdfSchema.index(
  { title: 1, college: 1, course: 1, semester: 1, year: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "approved" },
    name: "unique_approved_pdf_metadata",
  },
);
pdfSchema.index(
  { fileHash: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "approved",
      fileHash: { $type: "string" },
    },
    name: "unique_approved_pdf_file_hash",
  },
);

module.exports = mongoose.model("PDF", pdfSchema);
