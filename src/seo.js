const { Post } = require("./models");
const { baseUrl } = require("./config");

function abs(path) {
  const b = baseUrl.replace(/\/+$/,"");
  const p = path.startsWith("/") ? path : `/${path}`;
  return b + p;
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

module.exports = { abs, sitemapXml, robotsTxt };
