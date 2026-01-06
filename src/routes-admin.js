const express = require("express");
const { Setting, Post } = require("./models");
const { clearSettingsCache } = require("./settings-cache");
const cfg = require("./config");

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.session?.isAdmin) return next();
  return res.redirect(`${cfg.adminPath}/login`);
}
function verifyLogin(u, p) {
  return u === (process.env.ADMIN_USER || "admin") &&
         p === (process.env.ADMIN_PASS || "admin12345");
}

router.get("/login", (req, res) => {
  res.render("admin/login", { layout: "layouts/admin", error: null });
});
router.post("/login", (req, res) => {
  if (verifyLogin(req.body.username, req.body.password)) {
    req.session.isAdmin = true;
    return res.redirect(`${cfg.adminPath}`);
  }
  res.render("admin/login", { layout: "layouts/admin", error: "Invalid login." });
});
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect(`${cfg.adminPath}/login`));
});

router.get("/", requireAdmin, async (req, res) => {
  const count = await Post.count();
  const pub = await Post.count({ where: { status: "published" } });
  const draft = await Post.count({ where: { status: "draft" } });
  res.render("admin/dashboard", { layout: "layouts/admin", count, pub, draft });
});

router.get("/posts", requireAdmin, async (req, res) => {
  const posts = await Post.findAll({ order: [["updatedAt","DESC"]], limit: 200 });
  res.render("admin/posts", { layout: "layouts/admin", posts });
});

router.get("/settings", requireAdmin, async (req, res) => {
  const rows = await Setting.findAll();
  const s = {};
  rows.forEach(r => s[r.key] = r.value);

  res.render("admin/settings", { layout: "layouts/admin", saved: false, s });
});

router.post("/settings", requireAdmin, async (req, res) => {
  const keys = [
    "site_name","home_title","home_desc","accent_hex",
    "smartlink_url",
    "tmdb_api_key","tmdb_lang","tmdb_region",
    "auto_import_cron","import_source","import_pages",
    "auto_publish","min_overview_len","min_vote_count","require_poster"
  ];

  for (const k of keys) {
    await Setting.upsert({ key: k, value: String(req.body[k] ?? "") });
  }

  clearSettingsCache();

  const rows = await Setting.findAll();
  const s = {};
  rows.forEach(r => s[r.key] = r.value);

  res.render("admin/settings", { layout: "layouts/admin", saved: true, s });
});

module.exports = router;
