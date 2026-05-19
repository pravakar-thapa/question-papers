const mongoose = require("mongoose");
const env = require("./env");

const connectDb = () =>
  mongoose
    .connect(env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

module.exports = connectDb;
