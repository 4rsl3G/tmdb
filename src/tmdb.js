const axios = require("axios");

const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_LANG = process.env.TMDB_LANG || "en-US";
const TMDB_REGION = process.env.TMDB_REGION || "US";

function assertKey() {
  if (!TMDB_KEY) throw new Error("Missing TMDB_API_KEY in .env");
}

async function tmdbGet(path, params = {}) {
  assertKey();
  const url = `https://api.themoviedb.org/3${path}`;
  const res = await axios.get(url, {
    params: { api_key: TMDB_KEY, language: TMDB_LANG, region: TMDB_REGION, ...params },
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

module.exports = {
  tmdbGet, posterUrl, backdropUrl,
  pickTrailerKey, pickDirector, pickCast,
  listSource, movieFull
};
