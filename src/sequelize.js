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
    // branding
    site_name: "GreenPulse Movies",
    home_title: "Trending Movies (EN)",
    home_desc: "Posters, cast, trailers, and key details — fast, responsive, premium motion.",
    accent_hex: "#39ff9b",

    // smartlink
    smartlink_url: process.env.SMARTLINK_URL || "",

    // tmdb
    tmdb_api_key: process.env.TMDB_API_KEY || "",
    tmdb_lang: process.env.TMDB_LANG || "en-US",
    tmdb_region: process.env.TMDB_REGION || "US",

    // auto import
    auto_import_cron: "*/30 * * * *",
    import_source: "trending_day",
    import_pages: "1",

    // auto publish quality gate
    auto_publish: "true",
    min_overview_len: "120",
    min_vote_count: "50",
    require_poster: "true"
  };

  for (const [key, value] of Object.entries(defaults)) {
    await Setting.findOrCreate({ where: { key }, defaults: { value: String(value ?? "") } });
  }
}

module.exports = { sequelize, initDb };
