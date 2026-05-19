const env = require("./config/env");
const createApp = require("./config/app");
const connectDb = require("./config/db");
const {
  purgeExpiredDeletionRequests,
} = require("./services/accountService");

connectDb().then(() => purgeExpiredDeletionRequests());

setInterval(
  () => purgeExpiredDeletionRequests(),
  24 * 60 * 60 * 1000,
).unref();

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});
