const express = require("express");
const morgan = require("morgan");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const { setupMiddleware, injectGlobals } = require("./middleware");
const cfg = require("./config");

const publicRoutes = require("./routes-public");
const adminRoutes = require("./routes-admin");
const { sitemapXml, robotsTxt } = require("./seo");

function createApp() {
  const app = express();
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));

  app.use(expressLayouts);
  app.set("layout", "layouts/main");

  app.use(morgan("dev"));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, "..", "public")));

  setupMiddleware(app);
  app.use(injectGlobals);

  // SEO endpoints
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain").send(robotsTxt());
  });
  app.get("/sitemap.xml", async (req, res) => {
    res.type("application/xml").send(await sitemapXml());
  });

  app.use("/", publicRoutes);
  app.use(cfg.adminPath, adminRoutes);

  app.use((err, req, res, next) => {
    if (err.code === "EBADCSRFTOKEN") return res.status(403).send("CSRF invalid. Refresh and try again.");
    console.error(err);
    res.status(500).send("Server error");
  });

  return app;
}

module.exports = { createApp };
