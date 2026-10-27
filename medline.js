// Official health information from MedlinePlus.gov (U.S. National Library of Medicine),
// fetched through the CashCow server, which caches answers for a day.
// Shown when a search goes beyond the remedies in this app.

const API = "https://cashcow-reviews-api.onrender.com";
const cache = new Map();

export async function lookUpTopics(words, signal) {
  const q = words.join(" ").slice(0, 80);
  if (q.length < 3) return [];
  if (cache.has(q)) return cache.get(q);
  const res = await fetch(`${API}/api/health-topics?q=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) throw new Error("lookup failed");
  const data = await res.json();
  const list = Array.isArray(data.results) ? data.results.filter((t) => t && t.title && /^https:\/\/medlineplus\.gov\//.test(t.url)) : [];
  cache.set(q, list);
  return list;
}
