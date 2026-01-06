const axios = require("axios");
const { getAllSettings } = require("./settings-cache");

async function tmdbConfig() {
  const s = await getAllSettings();
  return {
    key: s.tmdb_api_key || process.env.TMDB_API_KEY || "",
    lang: s.tmdb_lang || process.env.TMDB_LANG || "en-US",
    region: s.tmdb_region || process.env.TMDB_REGION || "US"
  };
}

async function tmdbGet(path, params = {}) {
  const cfg = await tmdbConfig();
  if (!cfg.key) throw new Error("TMDb API key is empty. Set it in Admin Settings.");

  const url = `https://api.themoviedb.org/3${path}`;
  const res = await axios.get(url, {
    params: { api_key: cfg.key, language: cfg.lang, region: cfg.region, ...params },
    timeout: 15000
  });
  return res.data;
}

const posterUrl = (p) => p ? `https://image.tmdb.org/t/p/w500${p}` : "";
const backdropUrl = (p) => p ? `https://image.tmdb.org/t/p/w780${p}` : "";

function pickTrailerKey(videos){
  const arr = videos?.results || [];
  const yt = arr.find(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"));
  return yt ? yt.key : "";
}
function pickDirector(credits){
  const crew = credits?.crew || [];
  const d = crew.find(c => c.job === "Director");
  return d ? d.name : "";
}
function pickCast(credits){
  const cast = credits?.cast || [];
  return cast.slice(0, 10).map(x => ({ name: x.name, character: x.character }));
}

async function listSource(source, page=1) {
  if (source === "trending_day") return tmdbGet(`/trending/movie/day`, { page });
  if (source === "trending_week") return tmdbGet(`/trending/movie/week`, { page });
  if (source === "popular") return tmdbGet(`/movie/popular`, { page });
  if (source === "top_rated") return tmdbGet(`/movie/top_rated`, { page });
  if (source === "now_playing") return tmdbGet(`/movie/now_playing`, { page });
  return tmdbGet(`/trending/movie/day`, { page });
}

async function movieFull(id) {
  const details = await tmdbGet(`/movie/${id}`, { append_to_response: "credits,videos,images" });
  const providers = await tmdbGet(`/movie/${id}/watch/providers`, {});
  return { details, providers };
}

module.exports = { tmdbGet, posterUrl, backdropUrl, pickTrailerKey, pickDirector, pickCast, listSource, movieFull };
