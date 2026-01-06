const { Setting, Post } = require("./models");
const cfg = require("./config");

async function getSiteName() {
  return (await Setting.findByPk("site_name"))?.value || "GreenPulse Movies";
}

function abs(urlPath) {
  const base = cfg.baseUrl.replace(/\/+$/,"");
  const p = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
  return base + p;
}

async function sitemapXml() {
  const posts = await Post.findAll({
    where: { status: "published" },
    attributes: ["slug","updatedAt"],
    order: [["updatedAt","DESC"]],
    limit: 5000
  });

  const urls = [
    { loc: abs("/"), lastmod: new Date().toISOString() },
    ...posts.map(p => ({ loc: abs(`/p/${p.slug}`), lastmod: p.updatedAt.toISOString() }))
  ];

  const body = urls.map(u => `
  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${u.loc.endsWith("/") ? "1.0" : "0.7"}</priority>
  </url>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}
</urlset>`;
}

function robotsTxt() {
  return `User-agent: *
Allow: /
Sitemap: ${abs("/sitemap.xml")}
`;
}

module.exports = { abs, getSiteName, sitemapXml, robotsTxt };
