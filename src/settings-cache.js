const { Setting } = require("./models");

let cache = null;
let cacheAt = 0;
const TTL_MS = 10_000;

async function getAllSettings() {
  const now = Date.now();
  if (cache && (now - cacheAt) < TTL_MS) return cache;

  const rows = await Setting.findAll();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;

  cache = obj;
  cacheAt = now;
  return obj;
}

function clearSettingsCache() {
  cache = null;
  cacheAt = 0;
}

module.exports = { getAllSettings, clearSettingsCache };
