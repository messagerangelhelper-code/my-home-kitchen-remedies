// Friendlier remedy search: matches each word on its own, handles endings
// ("coughing" finds "cough") and everyday words ("tummy", "can't sleep").

const STOP = new Set([
  "a", "an", "the", "and", "or", "for", "of", "to", "in", "on", "with", "my", "me", "i", "im", "is", "it", "its",
  "how", "what", "whats", "do", "does", "can", "cant", "get", "rid", "help", "helps", "stop", "ease", "relief",
  "home", "remedy", "remedies", "natural", "naturally", "cure", "cures", "treat", "treatment", "best", "good",
  "fast", "quick", "quickly", "kid", "kids", "child", "baby", "have", "has", "got", "bad", "really", "very", "some",
]);

// Everyday words -> the topic they belong to (topic ids from remedies.js).
const TOPIC_WORDS = {
  throat: ["cough", "coughing", "throat", "sore", "scratchy", "hoarse", "cold", "colds", "flu", "phlegm", "mucus", "tickle", "laryngitis", "voice"],
  nose: ["nose", "stuffy", "congestion", "congested", "sinus", "sinuses", "runny", "blocked", "sniffle", "sniffles", "allergies", "hayfever", "cold", "colds"],
  stomach: ["stomach", "tummy", "belly", "nausea", "nauseous", "queasy", "vomit", "vomiting", "throwing", "indigestion", "gas", "gassy", "bloating", "bloated", "upset", "morning", "sickness", "ibs", "cramps"],
  constipation: ["constipation", "constipated", "bowel", "bowels", "regular", "poop", "fiber", "fibre", "backed"],
  skin: ["itch", "itchy", "itching", "rash", "rashes", "eczema", "hives", "bite", "bites", "mosquito", "bug", "dry", "skin", "irritated", "poison", "ivy", "sunburn", "chickenpox"],
  burn: ["burn", "burns", "burned", "burnt", "scald", "scalded", "sunburn", "blister"],
  eye: ["stye", "styes", "sty", "eyelid", "eye", "eyes", "bump"],
  relax: ["sleep", "sleeping", "insomnia", "asleep", "awake", "restless", "stress", "stressed", "anxious", "anxiety", "nervous", "relax", "relaxing", "calm", "unwind", "tired", "worry", "bedtime"],
  urinary: ["uti", "utis", "urinary", "bladder", "pee", "peeing", "urine", "urination"],
};

const WORD_TOPICS = {};
for (const [topic, words] of Object.entries(TOPIC_WORDS)) {
  for (const w of words) (WORD_TOPICS[stem(w)] ||= new Set()).add(topic);
}

function stem(w) {
  let s = w.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const end of ["ing", "ed", "es", "s"]) {
    if (s.length > end.length + 3 && s.endsWith(end)) { s = s.slice(0, -end.length); break; }
  }
  return s;
}

// The meaningful words someone typed, as they typed them.
export function queryWords(query) {
  return (query.toLowerCase().replace(/[’']/g, "").match(/[a-z0-9]+/g) || []).filter((w) => !STOP.has(w));
}

// Remedies that match, best first. An empty search returns them all.
export function searchRemedies(query, remedies, problems) {
  const words = queryWords(query);
  if (!words.length) return remedies;
  const scored = remedies.map((r) => {
    const probNames = r.problems.map((p) => problems.find((x) => x.id === p)?.name || "").join(" ");
    const hay = `${r.title} ${r.forWhat} ${probNames} ${r.ingredients.join(" ")}`;
    const hayStems = (hay.toLowerCase().match(/[a-z0-9]+/g) || []).map(stem);
    let score = 0;
    for (const w of words) {
      const s = stem(w);
      const topics = [...(WORD_TOPICS[s] || [])];
      const topicHit = topics.some((t) => r.problems.includes(t));
      if (topicHit) score += 3;
      // A topic word ("cold") found in a remedy about something else counts for little.
      if (s.length >= 3 && hayStems.some((h) => h === s || (s.length >= 4 && h.startsWith(s)))) score += topics.length && !topicHit ? 1 : 2;
    }
    return { r, score };
  });
  // Keep the strong matches; drop ones that only share a stray word.
  const best = Math.max(0, ...scored.map((x) => x.score));
  return scored.filter((x) => x.score > 0 && x.score >= best * 0.6).sort((a, b) => b.score - a.score).map((x) => x.r);
}

// Searches that need real help right now, not a kitchen remedy.
const URGENT = [
  { kind: "crisis", re: /\b(suicid\w*|kill (my ?self|myself)|end my life|self[- ]?harm\w*|want to die|hurt(ing)? myself)\b/ },
  { kind: "poison", re: /\b(poison(ed|ing)?|overdos\w*|swallowed (bleach|chemicals?|pills?|a battery|batteries))\b/ },
  { kind: "911", re: /\b(chest pain|heart attack|stroke|can'?t breathe|cannot breathe|trouble breathing|not breathing|choking|seizure|unconscious|passed out|anaphyla\w*|severe (bleeding|burn|allergic)|bleeding (a lot|heavily|won'?t stop)|throat (closing|swelling))\b/ },
];

export function urgentKind(query) {
  const q = query.toLowerCase().replace(/[’]/g, "'");
  if (/\bpoison ivy\b/.test(q)) return null;
  const hit = URGENT.find((u) => u.re.test(q));
  return hit ? hit.kind : null;
}
