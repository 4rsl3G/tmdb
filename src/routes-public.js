const express = require("express");
const { Post, Setting } = require("./models");
const { isAjax } = require("./middleware");
const { abs } = require("./seo");

const router = express.Router();

// home
router.get("/", async (req, res) => {
  const posts = await Post.findAll({
    where: { status: "published" },
    order: [["updatedAt","DESC"]],
    limit: 60
  });

  const title = res.locals.homeTitle + " • " + res.locals.siteName;
  const desc = res.locals.homeDesc;
  const canonical = abs("/");

  if (isAjax(req)) {
    return res.render("partials/home", { layout: false, posts, pageMeta: { title, desc, canonical } });
  }
  return res.render("partials/home", { layout: "layouts/main", posts, pageMeta: { title, desc, canonical } });
});

// smartlink redirect
router.get("/go/smartlink", async (req, res) => {
  const smart = (await Setting.findByPk("smartlink_url"))?.value || process.env.SMARTLINK_URL || "";
  if (!smart) return res.redirect("/");
  return res.redirect(smart);
});

// post
router.get("/p/:slug", async (req, res) => {
  const post = await Post.findOne({ where: { slug: req.params.slug, status: "published" } });
  if (!post) {
    const title = "Not Found • " + res.locals.siteName;
    const desc = "Page not found.";
    const canonical = abs(req.path);
    if (isAjax(req)) return res.status(404).render("partials/notfound", { layout: false, pageMeta: { title, desc, canonical } });
    return res.status(404).render("partials/notfound", { layout: "layouts/main", pageMeta: { title, desc, canonical } });
  }

  // First click => smartlink (one-time cookie)
  if (!req.cookies.visited_movie) {
    res.cookie("visited_movie", "1", { maxAge: 1000*60*60*24*30, httpOnly: true });
    return res.redirect("/go/smartlink");
  }

  const title = (post.meta_title || post.title) + " • " + res.locals.siteName;
  const desc = post.meta_desc || post.excerpt || "";
  const canonical = abs(`/p/${post.slug}`);

  if (isAjax(req)) return res.render("partials/post", { layout: false, post, pageMeta: { title, desc, canonical } });
  return res.render("partials/post", { layout: "layouts/main", post, pageMeta: { title, desc, canonical } });
});

module.exports = router;
