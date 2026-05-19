const env = require("./env");

const createCorsOptions = () => {
  const isDevelopment = env.NODE_ENV !== "production";

  return {
    origin(origin, callback) {
      if (isDevelopment && origin && /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }

      if (!origin || origin === env.FRONTEND_URL) {
        return callback(null, true);
      }

      callback(new Error("CORS not allowed"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Upload-As-User"],
    credentials: true,
  };
};

module.exports = createCorsOptions;
