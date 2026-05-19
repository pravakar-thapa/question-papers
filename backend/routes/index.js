const createAuthRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");
const commentRoutes = require("./commentRoutes");
const pdfRoutes = require("./pdfRoutes");
const userRoutes = require("./userRoutes");

const registerRoutes = (app, { authLimiter }) => {
  app.use(createAuthRoutes({ authLimiter }));
  app.use(userRoutes);
  app.use(adminRoutes);
  app.use(commentRoutes);
  app.use(pdfRoutes);
};

module.exports = registerRoutes;
