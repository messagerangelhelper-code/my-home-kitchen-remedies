// Saved on this phone only: who the remedies are for, favorites, kitchen and shopping list.
const KEY = "mhkr-data";

const DEFAULTS = { profile: [], bigText: false, setupDone: false, favorites: [], kitchen: [], shopping: [] };

export function loadData() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    return { ...DEFAULTS, ...(v && typeof v === "object" ? v : {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveData(d) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* storage not available (private window); the app still works */
  }
}
