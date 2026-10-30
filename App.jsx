import { useEffect, useMemo, useRef, useState } from "react";
import { BRAND } from "./brand.js";
import { REMEDIES, PROBLEMS, LEVELS, PROFILES, LAST_REVIEWED } from "./remedies.js";
import { ITEMS, NEEDS, itemName } from "./kitchen.js";
import { NUTRITION } from "./nutrition.js";
import { loadData, saveData } from "./storage.js";
import Premium from "./Premium.jsx";
import Account from "./Account.jsx";
import { supabase } from "./account.js";
import { isPremium, checkPremiumOnce, syncAccount } from "./premium.js";
import { searchRemedies, queryWords, urgentKind } from "./search.js";
import { lookUpTopics } from "./medline.js";

const URGENT_TEXT = {
  "911": { title: "This may be an emergency", body: "Call 911 now, or have someone take you to the nearest emergency room. Don't wait to try a home remedy.", call: "tel:911", label: "Call 911" },
  poison: { title: "Call Poison Help now", body: "Call 1-800-222-1222, free and open 24 hours. If the person is not breathing, collapsed or having a seizure, call 911.", call: "tel:18002221222", label: "Call 1-800-222-1222" },
  crisis: { title: "You don't have to go through this alone", body: "Call or text 988 to reach the Suicide & Crisis Lifeline, free and open 24 hours. If you're in danger right now, call 911.", call: "tel:988", label: "Call or text 988" },
};

function MedlineResults({ status, topics, hasRemedies, words }) {
  if (status === "idle") return null;
  // When we have remedies, MedlinePlus is a quiet extra: only show it if it found something.
  if (hasRemedies && (status !== "done" || topics.length === 0)) return null;
  return (
    <section className="card medline">
      <h2>{hasRemedies ? "More from MedlinePlus.gov" : `No home remedy for “${words.join(" ")}” yet`}</h2>
      {!hasRemedies && <p className="muted small">Here's official health information instead.</p>}
      {status === "loading" && <p className="muted small">Looking this up…</p>}
      {status === "error" && <p className="muted small">Couldn't load health information right now. Try again in a minute.</p>}
      {status === "done" && topics.length === 0 && (
        <p className="muted small">No match there either. Try a simpler word, like “cough” or “rash”, or pick a topic above.</p>
      )}
      {status === "done" && topics.length > 0 && (
        <ul className="medline-list">
          {topics.map((t) => (
            <li key={t.url}>
              <strong>{t.title}</strong>
              {t.summary && <p className="small">{t.summary}</p>}
              <a href={t.url} target="_blank" rel="noopener noreferrer">Read more on MedlinePlus.gov</a>
            </li>
          ))}
        </ul>
      )}
      <p className="muted small medline-credit">
        Information from MedlinePlus.gov, U.S. National Library of Medicine. Not medical advice. See a doctor if symptoms are severe, last, or get worse.
      </p>
    </section>
  );
}

const byId = Object.fromEntries(REMEDIES.map((r) => [r.id, r]));

const ICONS = {
  "honey-lemon": "🍯", "salt-gargle": "🧂", "saline-rinse": "💧", "ginger-tea": "🫚", "peppermint-tea": "🌿",
  "fiber-oats": "🥣", "oatmeal-bath": "🛁", "cool-compress": "🧊", "burn-first-aid": "🩹", aloe: "🪴",
  "stye-compress": "👁️", "chamomile-tea": "🌼", lavender: "💜", "golden-milk": "🥛", cranberry: "🫐",
};

function warningsFor(remedy, profile) {
  return remedy.avoid.filter((a) => a.who.some((w) => profile.includes(w)));
}

function LevelBadge({ level }) {
  return <span className={`badge badge-${level}`}>{LEVELS[level].short}</span>;
}

function Chips({ options, selected, onToggle, label }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map(([id, name]) => {
        const on = selected.includes(id);
        return (
          <button key={id} type="button" className={on ? "chip on" : "chip"} aria-pressed={on} onClick={() => onToggle(id)}>
            {on ? "✓ " : ""}{name}
          </button>
        );
      })}
    </div>
  );
}

function RemedyCard({ r, profile, saved, onOpen }) {
  const warn = warningsFor(r, profile).length > 0;
  const icons = ICONS[r.id] || PROBLEMS.find((x) => x.id === r.problems[0])?.icon;
  return (
    <li>
      <button type="button" className="card remedy-card" onClick={() => onOpen(r.id)}>
        <span className="rc-icon" aria-hidden="true">{icons}</span>
        <span className="rc-body">
          <strong>{r.title}{saved && <span className="saved-star" aria-label="Saved"> ★</span>}</strong>
          <span className="rc-meta">
            <LevelBadge level={r.level} />
            <span className="muted small">{r.time}</span>
            {warn && <span className="badge badge-warn">Check first</span>}
          </span>
        </span>
      </button>
    </li>
  );
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [view, setView] = useState(() => (loadData().setupDone ? "home" : "setup"));
  const [openId, setOpenId] = useState(null);
  const [problem, setProblem] = useState("");
  const [query, setQuery] = useState("");
  const [premium, setPremium] = useState(isPremium);
  const [notice, setNotice] = useState("");
  const [toast, setToast] = useState("");

  const update = (patch) => setData((d) => { const n = { ...d, ...patch }; saveData(n); return n; });

  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--green", BRAND.colors.main);
    root.setProperty("--green-2", BRAND.colors.mainHover);
    root.setProperty("--mint", BRAND.colors.soft);
    document.title = BRAND.name;
    checkPremiumOnce().then((status) => {
      setPremium(isPremium());
      if (status === "activated") setNotice("Premium is active. Thank you! My Remedies, My Kitchen and the shopping list are unlocked.");
      else if (status === "expired") setNotice("Your Premium plan has ended. Every remedy and its safety info are still free.");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
      syncAccount().then((status) => {
        setPremium(isPremium());
        if (status === "activated") setNotice("Welcome back! Premium from your CashCow account is on.");
      });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("big-text", !!data.bigText);
  }, [data.bigText]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [view, openId]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const list = useMemo(
    () => searchRemedies(query, REMEDIES.filter((r) => !problem || r.problems.includes(problem)), PROBLEMS),
    [problem, query],
  );
  const words = useMemo(() => queryWords(query), [query]);
  const urgent = urgentKind(query);
  const searching = Boolean(problem) || query.trim().length > 0;
  const answerRef = useRef(null);
  const [jump, setJump] = useState(0);
  // Bring the answer into view when a topic is picked or Search is pressed.
  useEffect(() => {
    if (!jump || !answerRef.current) return;
    answerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    answerRef.current.classList.remove("glow"); void answerRef.current.offsetWidth; answerRef.current.classList.add("glow");
  }, [jump]);
  const [medline, setMedline] = useState({ status: "idle", topics: [] });

  // Look up MedlinePlus a moment after typing stops.
  useEffect(() => {
    if (urgent || words.join(" ").length < 3) { setMedline({ status: "idle", topics: [] }); return undefined; }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setMedline({ status: "loading", topics: [] });
      lookUpTopics(words, ctrl.signal)
        .then((topics) => setMedline({ status: "done", topics: list.length ? topics.slice(0, 2) : topics }))
        .catch((e) => { if (e.name !== "AbortError") setMedline({ status: "error", topics: [] }); });
    }, 700);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [words.join(" "), urgent, list.length]);

  const open = (id) => { setOpenId(id); setView("remedy"); };
  const goPremium = () => setView("premium");
  const toggleIn = (field, id) => update({ [field]: data[field].includes(id) ? data[field].filter((x) => x !== id) : [...data[field], id] });

  function addToShopping(r) {
    if (!premium) return goPremium();
    const missing = (NEEDS[r.id] || []).filter((i) => !data.kitchen.includes(i));
    const items = (missing.length ? missing : NEEDS[r.id] || []).map(itemName);
    const merged = [...data.shopping];
    for (const name of items) if (!merged.some((s) => s.name === name)) merged.push({ name, done: false });
    update({ shopping: merged });
    setToast(missing.length ? `Added ${missing.length} item${missing.length === 1 ? "" : "s"} to your shopping list.` : "You have everything for this one!");
  }

  const remedy = openId ? byId[openId] : null;
  const myWarnings = remedy ? warningsFor(remedy, data.profile) : [];
  const canMake = REMEDIES.filter((r) => (NEEDS[r.id] || []).every((i) => data.kitchen.includes(i)));
  const almost = REMEDIES.filter((r) => {
    const need = NEEDS[r.id] || [];
    const miss = need.filter((i) => !data.kitchen.includes(i));
    return need.length > 1 && miss.length === 1;
  });

  const ProfileSettings = (
    <>
      <h3>Who's this for?</h3>
      <p className="muted small">Pick anyone in your home. Remedies that need extra care for them get a "Check first" label and a warning at the top. Saved on this phone only.</p>
      <Chips options={Object.entries(PROFILES)} selected={data.profile} onToggle={(id) => toggleIn("profile", id)} label="Who's this for" />
      <h3>Easier reading</h3>
      <label className="toggle">
        <input type="checkbox" checked={data.bigText} onChange={(e) => update({ bigText: e.target.checked })} />
        <span>Bigger text and buttons</span>
      </label>
    </>
  );

  return (
    <div className="app">
      <header className="top">
        <button type="button" className="brand" onClick={() => { setView("home"); setOpenId(null); }} aria-label={`${BRAND.name} home`}>
          <span className="logo" aria-hidden="true">🌿</span>
          <span>{BRAND.name}</span>
        </button>
        {view !== "setup" && <button type="button" className="link light" onClick={() => setView("settings")}>Settings</button>}
      </header>

      <main>
        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button type="button" className="link" onClick={() => setNotice("")} aria-label="Dismiss">✕</button>
          </div>
        )}
        {toast && <div className="toast" role="status">{toast}</div>}

        {view === "setup" && (
          <section className="card settings">
            <h1>Welcome</h1>
            <p>{BRAND.tagline}</p>
            {ProfileSettings}
            <button type="button" className="btn-primary" onClick={() => { update({ setupDone: true }); setView("home"); }}>Start</button>
          </section>
        )}

        {view === "settings" && (
          <>
            <section className="card settings">
              <h2>Settings</h2>
              {ProfileSettings}
              <button type="button" className="btn-primary" onClick={() => setView(openId ? "remedy" : "home")}>Done</button>
            </section>
            <Account premium={premium} />
          </>
        )}

        {view === "premium" && <Premium premium={premium} onBack={() => setView(openId ? "remedy" : "home")} />}

        {view === "home" && (
          <>
            <section className="card hero">
              <h1>What's bothering you?</h1>
              <label htmlFor="search" className="sr-only">Search remedies</label>
              <form role="search" onSubmit={(e) => { e.preventDefault(); e.target.querySelector("input").blur(); setJump((n) => n + 1); }}>
                <input id="search" type="search" enterKeyHint="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. cough, itchy skin, burn" />
              </form>
              {urgent && (
                <div className="urgent" role="alert">
                  <h2>{URGENT_TEXT[urgent].title}</h2>
                  <p>{URGENT_TEXT[urgent].body}</p>
                  <a className="btn-primary urgent-call" href={URGENT_TEXT[urgent].call}>{URGENT_TEXT[urgent].label}</a>
                </div>
              )}
              <div className="problems">
                {PROBLEMS.map((p) => (
                  <button key={p.id} type="button" className={problem === p.id ? "problem on" : "problem"} aria-pressed={problem === p.id}
                    onClick={() => { setProblem(problem === p.id ? "" : p.id); if (problem !== p.id) setJump((n) => n + 1); }}>
                    <span aria-hidden="true">{p.icon}</span>{p.name}
                  </button>
                ))}
              </div>
            </section>

            {searching && !urgent && (
              <section ref={answerRef} className="answer" aria-live="polite">
                <p className="answer-tag">👉 Your answer</p>
                <h2 className="answer-title">
                  {list.length > 0
                    ? `${list.length} ${list.length === 1 ? "remedy" : "remedies"} for ${query.trim() ? `“${query.trim()}”` : (PROBLEMS.find((p) => p.id === problem) || {}).name}`
                    : "No home remedy match yet"}
                </h2>
                {list.length > 0 && (
                  <ul className="remedy-list">
                    {list.map((r) => <RemedyCard key={r.id} r={r} profile={data.profile} saved={premium && data.favorites.includes(r.id)} onOpen={open} />)}
                  </ul>
                )}
                {list.length === 0 && words.join(" ").length < 3 && (
                  <p className="empty">No remedies match that yet. Try another word, or pick a topic above.</p>
                )}
                <MedlineResults status={medline.status} topics={medline.topics} hasRemedies={list.length > 0} words={words} />
                <button type="button" className="link" onClick={() => { setProblem(""); setQuery(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>✕ Clear and start over</button>
              </section>
            )}

            <div className="quick-nav">
              <button type="button" className="qn" onClick={() => setView("saved")}>★ My Remedies{!premium && <span className="pill-premium">Premium</span>}</button>
              <button type="button" className="qn" onClick={() => setView("kitchen")}>🧺 My Kitchen{!premium && <span className="pill-premium">Premium</span>}</button>
              <button type="button" className="qn" onClick={() => setView("list")}>📝 Shopping list{!premium && <span className="pill-premium">Premium</span>}</button>
            </div>

            <section className="card nutrition-teaser">
              <h2>🥗 Kitchen Nutrition</h2>
              <p className="muted small">Everyday recipes packed with nutrients your body uses. Food, not medicine.</p>
              <ul className="remedy-list">
                {NUTRITION.map((n) => (
                  <li key={n.id}>
                    <button type="button" className="card remedy-card" onClick={() => { setOpenId(n.id); setView("nutrition"); }}>
                      <span className="rc-icon" aria-hidden="true">{n.icon}</span>
                      <span className="rc-body">
                        <strong>{n.title}</strong>
                        <span className="rc-meta"><span className="badge badge-food">Nutrition</span><span className="muted small">{n.time} · {n.serves}</span></span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <div className="emergency">
              <strong>Emergency?</strong> Call 911 for trouble breathing, chest pain, a severe burn, or signs of a serious allergic reaction. These remedies are for minor, everyday problems.
            </div>

            {!premium && (
              <section className="card premium-teaser">
                <h2>Go Premium</h2>
                <p className="muted">Save your favorite remedies, see what you can make with what's in your kitchen, and keep a shopping list. From $1.99 a month.</p>
                <button type="button" className="btn-primary" onClick={goPremium}>See plans</button>
              </section>
            )}

            <section className="card community-link">
              <h2>💬 CashCow Community</h2>
              <p className="muted">Swap tips with other members in the <strong>Home Remedies</strong> channel. Uses your free CashCow account.</p>
              <a className="btn-secondary community-btn" href="https://cashcowai.online/community.html#remedies" target="_blank" rel="noopener noreferrer">Open the community</a>
            </section>

            <section className="card levels-key">
              <h2>How we rate the evidence</h2>
              <ul className="plain">
                {Object.entries(LEVELS).map(([k, v]) => <li key={k}><LevelBadge level={k} /> {v.note}</li>)}
              </ul>
            </section>

            <p className="disclaimer">
              Information only, not medical advice. Always check with your doctor or pharmacist if you're pregnant, caring for a child, or take medicine.
              Sources reviewed {LAST_REVIEWED}.
            </p>
          </>
        )}

        {view === "remedy" && remedy && (
          <article className="remedy">
            <button type="button" className="link" onClick={() => { setView("home"); setOpenId(null); }}>← All remedies</button>
            <section className="card">
              <h1>{remedy.title}</h1>
              <p className="rc-meta"><LevelBadge level={remedy.level} /> <span className="muted small">{LEVELS[remedy.level].label} · {remedy.time}</span></p>
              <p className="for-what"><strong>Helps with:</strong> {remedy.forWhat}</p>
              <p className="muted small">{LEVELS[remedy.level].note}</p>
            </section>

            {myWarnings.length > 0 && (
              <section className="card alert-box" role="note">
                <h2>⚠️ Check first</h2>
                <ul className="plain">{myWarnings.map((w) => <li key={w.text}>{w.text}</li>)}</ul>
              </section>
            )}

            <section className="card">
              <h2>🧺 You'll need</h2>
              <ul className="plain">{remedy.ingredients.map((i) => <li key={i}>{i}</li>)}</ul>
              <h2 className="hl">👉 How to make it</h2>
              <ol className="steps">{remedy.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </section>

            {remedy.avoid.length > 0 && (
              <section className="card careful">
                <h2>⚠️ Be careful</h2>
                <ul className="plain">{remedy.avoid.map((a) => <li key={a.text}>{a.text}</li>)}</ul>
              </section>
            )}

            <section className="card doctor">
              <h2>🩺 See a doctor if</h2>
              <ul className="plain">{remedy.doctor.map((d) => <li key={d}>{d}</li>)}</ul>
            </section>

            <div className="button-row">
              <button type="button" className="btn-secondary" onClick={() => (premium ? toggleIn("favorites", remedy.id) : goPremium())}>
                {premium && data.favorites.includes(remedy.id) ? "★ Saved" : "☆ Save"}{!premium && <span className="pill-premium">Premium</span>}
              </button>
              <button type="button" className="btn-secondary" onClick={() => addToShopping(remedy)}>
                Add to shopping list{!premium && <span className="pill-premium">Premium</span>}
              </button>
              <button type="button" className="btn-secondary" onClick={() => window.print()}>Print</button>
            </div>

            <section className="card sources">
              <h2>📚 Sources</h2>
              <ul className="plain">{remedy.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a></li>)}</ul>
              <p className="muted small">Information only, not medical advice. Reviewed {LAST_REVIEWED}.</p>
            </section>
          </article>
        )}

        {view === "nutrition" && (() => {
          const n = NUTRITION.find((x) => x.id === openId);
          if (!n) return null;
          const mine = n.avoid.filter((a) => a.who.some((w) => data.profile.includes(w)));
          return (
            <article className="remedy">
              <button type="button" className="link" onClick={() => { setView("home"); setOpenId(null); }}>← Back</button>
              <section className="card">
                <h1>{n.title}</h1>
                <p className="rc-meta"><span className="badge badge-food">Nutrition</span> <span className="muted small">{n.time} · makes {n.serves}</span></p>
                <p>{n.intro}</p>
              </section>
              {mine.length > 0 && (
                <section className="card alert-box" role="note">
                  <h2>⚠️ Check first</h2>
                  <ul className="plain">{mine.map((w) => <li key={w.text}>{w.text}</li>)}</ul>
                </section>
              )}
              <section className="card">
                <h2>🧺 You'll need</h2>
                <ul className="plain">{n.ingredients.map((i) => <li key={i}>{i}</li>)}</ul>
                <h2 className="hl">👉 How to make it</h2>
                <ol className="steps">{n.steps.map((s) => <li key={s}>{s}</li>)}</ol>
              </section>
              <section className="card">
                <h2>💪 What each body system gets</h2>
                <div className="systems">
                  {n.systems.map(([sys, what, from]) => (
                    <div key={sys} className="system-row">
                      <strong>{sys}</strong>
                      <span>{what}</span>
                      <span className="muted small">From: {from}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="card careful">
                <h2>⚠️ Be careful</h2>
                <ul className="plain">{n.avoid.map((a) => <li key={a.text}>{a.text}</li>)}</ul>
              </section>
              <div className="button-row">
                <button type="button" className="btn-secondary" onClick={() => window.print()}>Print</button>
              </div>
              <section className="card sources">
                <h2>📚 Sources</h2>
                <ul className="plain">{n.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a></li>)}</ul>
                <p className="muted small">Information only, not medical advice. Reviewed {LAST_REVIEWED}.</p>
              </section>
            </article>
          );
        })()}

        {(view === "saved" || view === "kitchen" || view === "list") && !premium && (
          <Premium premium={false} onBack={() => setView("home")} />
        )}

        {view === "saved" && premium && (
          <section className="card">
            <h2>★ My Remedies</h2>
            {data.favorites.length === 0 ? (
              <p className="muted">Nothing saved yet. Open a remedy and tap ☆ Save.</p>
            ) : (
              <ul className="remedy-list">{data.favorites.filter((id) => byId[id]).map((id) => <RemedyCard key={id} r={byId[id]} profile={data.profile} saved onOpen={open} />)}</ul>
            )}
          </section>
        )}

        {view === "kitchen" && premium && (
          <>
            <section className="card">
              <h2>🧺 My Kitchen</h2>
              <p className="muted">Tick what you have at home. We'll show what you can make right now.</p>
              <Chips options={ITEMS.map((i) => [i.id, i.name])} selected={data.kitchen} onToggle={(id) => toggleIn("kitchen", id)} label="What's in my kitchen" />
            </section>
            <section className="card">
              <h2>You can make now ({canMake.length})</h2>
              {canMake.length === 0 ? <p className="muted">Tick a few items above to see matches.</p> : (
                <ul className="remedy-list">{canMake.map((r) => <RemedyCard key={r.id} r={r} profile={data.profile} saved={data.favorites.includes(r.id)} onOpen={open} />)}</ul>
              )}
              {almost.length > 0 && (
                <>
                  <h3>Just one thing missing</h3>
                  <ul className="plain">
                    {almost.map((r) => (
                      <li key={r.id}>
                        <button type="button" className="link" onClick={() => open(r.id)}>{r.title}</button>{" "}
                        <span className="muted small">needs {itemName((NEEDS[r.id] || []).find((i) => !data.kitchen.includes(i)))}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </>
        )}

        {view === "list" && premium && (
          <section className="card">
            <div className="row-between">
              <h2>📝 Shopping list</h2>
              {data.shopping.some((s) => s.done) && (
                <button type="button" className="link" onClick={() => update({ shopping: data.shopping.filter((s) => !s.done) })}>Clear bought</button>
              )}
            </div>
            {data.shopping.length === 0 ? (
              <p className="muted">Empty. Open a remedy and tap "Add to shopping list".</p>
            ) : (
              <ul className="shopping">
                {data.shopping.map((s, i) => (
                  <li key={s.name}>
                    <label className="check-row">
                      <input type="checkbox" checked={s.done}
                        onChange={() => update({ shopping: data.shopping.map((x, j) => (j === i ? { ...x, done: !x.done } : x)) })} />
                      <span className={s.done ? "done" : ""}>{s.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
