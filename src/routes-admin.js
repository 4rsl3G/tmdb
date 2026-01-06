const express = require("express");
const { Setting, Post } = require("./models");
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
  const get = async (k, fb="") => (await Setting.findByPk(k))?.value ?? fb;
  res.render("admin/settings", {
    layout: "layouts/admin",
    saved: false,
    site_name: await get("site_name",""),
    home_title: await get("home_title",""),
    home_desc: await get("home_desc",""),
    smartlink_url: await get("smartlink_url","")
  });
});
router.post("/settings", requireAdmin, async (req, res) => {
  const fields = ["site_name","home_title","home_desc","smartlink_url"];
  for (const f of fields) await Setting.upsert({ key: f, value: req.body[f] || "" });
  res.render("admin/settings", { layout: "layouts/admin", saved: true, ...req.body });
});

module.exports = router;
