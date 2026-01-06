const cron = require("node-cron");
const { Post } = require("./models");
const { listSource, movieFull, posterUrl, backdropUrl, pickTrailerKey, pickDirector, pickCast } = require("./tmdb");
const cfg = require("./config");

function slugify(s) {
  return (s || "").toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

function qualityGate({ overview, voteCount, hasPoster }) {
  if (!cfg.autoPublish) return false;
  if (cfg.requirePoster && !hasPoster) return false;
  if ((overview || "").length < cfg.minOverviewLen) return false;
  if ((voteCount || 0) < cfg.minVoteCount) return false;
  return true;
}

async function importOnce() {
  for (let page = 1; page <= cfg.importPages; page++) {
    const list = await listSource(cfg.importSource, page);
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

      const publish = qualityGate({ overview: d.overview, voteCount: d.vote_count, hasPoster: !!pUrl });
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

  console.log(`[cron] import done: ${cfg.importSource}, pages=${cfg.importPages}`);
}

function startCron() {
  importOnce().catch(e => console.error("[cron] first run error:", e.message));
  cron.schedule(cfg.autoImportCron, () => {
    importOnce().catch(e => console.error("[cron] error:", e.message));
  });
}

module.exports = { startCron };
