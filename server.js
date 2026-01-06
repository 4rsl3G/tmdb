require("dotenv").config();
const { createApp } = require("./src/app");
const { initDb } = require("./src/sequelize");
const { startCron } = require("./src/cron");

(async () => {
  await initDb();
  const app = createApp();
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Running: http://localhost:${port}`));
  startCron();
})();
