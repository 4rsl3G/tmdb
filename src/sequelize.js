const { Sequelize } = require("sequelize");
const path = require("path");
const fs = require("fs");

const dbDir = path.join(__dirname, "..", "db");
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(dbDir, "database.sqlite"),
  logging: false
});

async function initDb() {
  const { Setting } = require("./models");
  await sequelize.authenticate();
  await sequelize.sync();

  const defaults = {
    site_name: "GreenPulse Movies",
    home_title: "Trending Movies (EN)",
    home_desc: "Fresh movie pages with posters, cast, trailers — fast and mobile-first.",
    smartlink_url: process.env.SMARTLINK_URL || ""
  };

  for (const [key, value] of Object.entries(defaults)) {
    await Setting.findOrCreate({ where: { key }, defaults: { value: value ?? "" } });
  }
}

module.exports = { sequelize, initDb };
