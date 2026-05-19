const PDF = require("../models/PDF");
const User = require("../models/User");

const ACCOUNT_DELETION_WAIT_DAYS = 30;
const PASSWORD_MIN_LENGTH = 6;

const passwordValidationError = (password) => {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  return null;
};

const deletionScheduleDate = (fromDate = new Date()) => {
  const scheduledFor = new Date(fromDate);
  scheduledFor.setDate(scheduledFor.getDate() + ACCOUNT_DELETION_WAIT_DAYS);
  return scheduledFor;
};

const permanentlyDeleteUserAccount = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  await User.updateMany(
    { savedPdfs: user._id },
    { $pull: { savedPdfs: user._id } },
  );

  await PDF.updateMany(
    { submittedBy: user._id },
    {
      $set: { submittedByName: user.username || "deleted-user" },
      $unset: { submittedBy: "" },
    },
  );

  await User.findByIdAndDelete(user._id);
  return user;
};

const purgeExpiredDeletionRequests = async (now = new Date()) => {
  const expiredUsers = await User.find({
    deletionScheduledFor: { $lte: now },
  }).select("_id");

  for (const user of expiredUsers) {
    await permanentlyDeleteUserAccount(user._id);
  }

  return expiredUsers.length;
};

module.exports = {
  ACCOUNT_DELETION_WAIT_DAYS,
  deletionScheduleDate,
  passwordValidationError,
  permanentlyDeleteUserAccount,
  purgeExpiredDeletionRequests,
};
