const User = require("../models/User");

const getUserId = (value) => value?._id || value;

const adjustContributionCount = async (user, delta) => {
  const userId = getUserId(user);
  if (!userId || delta === 0) return;

  await User.updateOne(
    { _id: userId },
    [
      {
        $set: {
          contributionCount: {
            $max: [
              0,
              { $add: [{ $ifNull: ["$contributionCount", 0] }, delta] },
            ],
          },
        },
      },
    ],
  );
};

const adjustContributionForStatusChange = async ({
  submittedBy,
  statusFrom,
  statusTo,
}) => {
  if (statusFrom === statusTo) return;

  if (statusFrom !== "approved" && statusTo === "approved") {
    await adjustContributionCount(submittedBy, 1);
  }

  if (statusFrom === "approved" && statusTo !== "approved") {
    await adjustContributionCount(submittedBy, -1);
  }
};

module.exports = {
  adjustContributionForStatusChange,
};
