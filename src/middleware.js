const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const csurf = require("csurf");
const sanitizeHtml = require("sanitize-html");
const { Setting } = require("./models");
const cfg = require("./config");
const { abs } = require("./seo");

function isAjax(req) {
  return req.get("X-Requested-With") === "XMLHttpRequest";
}

async function injectGlobals(req, res, next) {
  const get = async (key, fallback="") => (await Setting.findByPk(key))?.value ?? fallback;

  res.locals.siteName = await get("site_name", "GreenPulse Movies");
  res.locals.homeTitle = await get("home_title", "Trending Movies (EN)");
  res.locals.homeDesc = await get("home_desc", "Fresh movie pages with posters, cast, trailers.");

  res.locals.adminPath = cfg.adminPath;
  res.locals.canonical = abs(req.path);

  res.locals.sanitize = (html) => sanitizeHtml(html || "", {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1","h2","h3","hr"]),
    allowedAttributes: {
      a: ["href","name","target","rel"],
      img: ["src","alt","title","width","height","loading","referrerpolicy"]
    },
    allowedSchemes: ["http","https","data"]
  });

  res.locals.isAjax = isAjax(req);
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
