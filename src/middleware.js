const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const csurf = require("csurf");
const sanitizeHtml = require("sanitize-html");
const { getAllSettings } = require("./settings-cache");
const { abs } = require("./seo");
const cfg = require("./config");

function isAjax(req) {
  return req.get("X-Requested-With") === "XMLHttpRequest";
}

async function injectGlobals(req, res, next) {
  const s = await getAllSettings();

  res.locals.siteName = s.site_name || "GreenPulse Movies";
  res.locals.homeTitle = s.home_title || "Trending Movies (EN)";
  res.locals.homeDesc = s.home_desc || "Posters, cast, trailers — fast and responsive.";
  res.locals.accentHex = s.accent_hex || "#39ff9b";

  res.locals.adminPath = cfg.adminPath;
  res.locals.canonical = abs(req.path);
  res.locals.isAjax = isAjax(req);

  res.locals.sanitize = (html) => sanitizeHtml(html || "", {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img","h1","h2","h3","hr"]),
    allowedAttributes: {
      a: ["href","name","target","rel"],
      img: ["src","alt","title","width","height","loading","referrerpolicy"]
    },
    allowedSchemes: ["http","https","data"]
  });

  next();
}

function setupMiddleware(app) {
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());
  app.use(session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true }
  }));
  app.use(csurf({ cookie: true }));
  app.use((req, res, next) => { res.locals.csrfToken = req.csrfToken(); next(); });
}

module.exports = { setupMiddleware, injectGlobals, isAjax };
