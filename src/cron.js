const cron = require("node-cron");
const { Post } = require("./models");
const { getAllSettings } = require("./settings-cache");
const { listSource, movieFull, posterUrl, backdropUrl, pickTrailerKey, pickDirector, pickCast } = require("./tmdb");

function slugify(s) {
  return (s || "").toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

function toBool(v, d=false) {
  if (v === undefined || v === null) return d;
  return String(v).toLowerCase() === "true";
}
function toInt(v, d=0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function qualityGate(s, d, hasPoster) {
  const autoPublish = toBool(s.auto_publish, true);
  if (!autoPublish) return false;

  const requirePoster = toBool(s.require_poster, true);
  const minOverview = toInt(s.min_overview_len, 120);
  const minVote = toInt(s.min_vote_count, 50);

  if (requirePoster && !hasPoster) return false;
  if ((d.overview || "").length < minOverview) return false;
  if ((d.vote_count || 0) < minVote) return false;
  return true;
}

async function importOnce() {
  const s = await getAllSettings();
  const source = s.import_source || "trending_day";
  const pages = Math.max(1, Math.min(5, toInt(s.import_pages, 1)));

  for (let page=1; page<=pages; page++) {
    const list = await listSource(source, page);
    const items = list.results || [];

    for (const m of items) {
      const { details: d, providers } = await movieFull(m.id);

      const title = d.title || "Untitled";
      const year = (d.release_date || "").slice(0,4);
      const slug = slugify(`${title}-${year || d.id}`);

      const genres = d.genres || [];
      const trailerKey = pickTrailerKey(d.videos);
      const director = pickDirector(d.credits);
      const cast = pickCast(d.credits);

      const pUrl = posterUrl(d.poster_path);
      const bUrl = backdropUrl(d.backdrop_path);
      const excerpt = (d.overview || "").slice(0, 160);

      const content = `
        <p><strong>Release date:</strong> ${d.release_date || "-"}</p>
        <p><strong>Runtime:</strong> ${d.runtime ? d.runtime + " min" : "-"}</p>
        <p><strong>Genres:</strong> ${genres.map(g=>g.name).join(", ") || "-"}</p>
        ${pUrl ? `<p><img loading="lazy" referrerpolicy="no-referrer" src="${pUrl}" alt="${title} poster"></p>` : ""}
        <h2>Overview</h2>
        <p>${d.overview || "-"}</p>
        ${director ? `<p><strong>Director:</strong> ${director}</p>` : ""}
        ${cast?.length ? `<p><strong>Top Cast:</strong> ${cast.map(x=>x.name).join(", ")}</p>` : ""}
        ${trailerKey ? `<p><a href="https://www.youtube.com/watch?v=${trailerKey}" target="_blank" rel="nofollow noopener">Watch Trailer</a></p>` : ""}
      `;

      const publish = qualityGate(s, d, !!pUrl);
      const status = publish ? "published" : "draft";

      await Post.upsert({
        tmdb_id: d.id,
        title,
        slug,
        excerpt,
        content,
        meta_title: title,
        meta_desc: excerpt,
        status,

        poster_url: pUrl,
        backdrop_url: bUrl,

        release_date: d.release_date || "",
        release_year: year || "",
        runtime: d.runtime || null,

        genres_json: JSON.stringify(genres),
        vote_average: d.vote_average || null,
        vote_count: d.vote_count || null,

        director: director || "",
        cast_json: JSON.stringify(cast || []),

        trailer_key: trailerKey || "",
        providers_json: JSON.stringify(providers?.results || {})
      });
    }
  }

  console.log(`[cron] imported: ${source} pages=${pages}`);
}

function startCron() {
  // run once
  importOnce().catch(e => console.error("[cron] first run:", e.message));

  // schedule from settings
  cron.schedule("*/1 * * * *", async () => {
    // every minute: check cron setting, but run import only when matches
    // (simple approach: we keep a real scheduler below)
  });

  // Real scheduler: read cron string periodically and reschedule
  let task = null;
  async function reschedule() {
    const s = await getAllSettings();
    const expr = s.auto_import_cron || "*/30 * * * *";
    if (task) task.stop();

    task = cron.schedule(expr, () => {
      importOnce().catch(e => console.error("[cron] error:", e.message));
    });

    console.log("[cron] scheduled:", expr);
  }
  reschedule().catch(console.error);

  // re-check schedule every 60s (in case admin changed settings)
  setInterval(() => reschedule().catch(()=>{}), 60_000);
}

module.exports = { startCron };
