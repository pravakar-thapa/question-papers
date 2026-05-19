const crypto = require("crypto");

const createFileHash = (buffer) =>
  crypto.createHash("sha256").update(buffer).digest("hex");

module.exports = {
  createFileHash,
};
