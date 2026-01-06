module.exports = {
  adminPath: process.env.ADMIN_PATH || "/admin",
  baseUrl: process.env.BASE_URL || "http://localhost:3000",

  smartlinkUrl: process.env.SMARTLINK_URL || "",

  autoImportCron: process.env.AUTO_IMPORT_CRON || "*/30 * * * *",
  importSource: process.env.IMPORT_SOURCE || "trending_day",
  importPages: Math.max(1, Math.min(5, Number(process.env.IMPORT_PAGES || 1))),

  autoPublish: (process.env.AUTO_PUBLISH || "true").toLowerCase() === "true",
  minOverviewLen: Math.max(0, Number(process.env.MIN_OVERVIEW_LEN || 120)),
  minVoteCount: Math.max(0, Number(process.env.MIN_VOTE_COUNT || 50)),
  requirePoster: (process.env.REQUIRE_POSTER || "true").toLowerCase() === "true"
};
