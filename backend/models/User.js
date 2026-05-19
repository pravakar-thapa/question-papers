const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
      index: true,
    },
    bannedAt: Date,
    bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    banReason: String,
    deletionRequestedAt: Date,
    deletionScheduledFor: { type: Date, index: true },
    deletionReason: String,
    deletionRequestedBy: {
      type: String,
      enum: ["user", "admin"],
    },
    contributionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    savedPdfs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PDF",
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
