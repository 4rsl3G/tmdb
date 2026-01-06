const express = require("express");
const { Post } = require("./models");
const { getAllSettings } = require("./settings-cache");
const { isAjax } = require("./middleware");
const { abs } = require("./seo");

const router = express.Router();

router.get("/", async (req, res) => {
  const posts = await Post.findAll({
    where: { status: "published" },
    order: [["updatedAt","DESC"]],
    limit: 60
  });

  const title = `${res.locals.homeTitle} • ${res.locals.siteName}`;
  const desc = res.locals.homeDesc;
  const canonical = abs("/");

  const data = { posts, pageMeta: { title, desc, canonical } };

  if (isAjax(req)) return res.render("partials/home", { ...data, layout: false });
  return res.render("partials/home", data); // <== pakai default layout
});

router.get("/go/smartlink", async (req, res) => {
  const s = await getAllSettings();
  const smart = s.smartlink_url || process.env.SMARTLINK_URL || "";
  if (!smart) return res.redirect("/");
  return res.redirect(smart);
});

router.get("/p/:slug", async (req, res) => {
  const post = await Post.findOne({ where: { slug: req.params.slug, status: "published" } });
  const canonical = abs(req.path);

  if (!post) {
    const data = { pageMeta: { title: `Not Found • ${res.locals.siteName}`, desc: "Page not found.", canonical } };
    if (isAjax(req)) return res.status(404).render("partials/notfound", { ...data, layout: false });
    return res.status(404).render("partials/notfound", data);
  }

  if (!req.cookies.visited_movie) {
    res.cookie("visited_movie", "1", { maxAge: 1000*60*60*24*30, httpOnly: true });
    return res.redirect("/go/smartlink");
  }

  const title = `${(post.meta_title || post.title)} • ${res.locals.siteName}`;
  const desc = post.meta_desc || post.excerpt || "";
  const data = { post, pageMeta: { title, desc, canonical: abs(`/p/${post.slug}`) } };

  if (isAjax(req)) return res.render("partials/post", { ...data, layout: false });
  return res.render("partials/post", data);
});

module.exports = router;
