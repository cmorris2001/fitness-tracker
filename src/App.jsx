import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";
import * as db from "./Db";
import Login from "./login";

const TABS = ["Dashboard", "Meals", "Exercise", "Steps", "Body"];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MEASUREMENT_OPTIONS = [
  { key: "weight", label: "Weight", unit: "kg" },
  { key: "stomach", label: "Stomach", unit: "cm" },
  { key: "bicepL", label: "Bicep (L)", unit: "cm" },
  { key: "bicepR", label: "Bicep (R)", unit: "cm" },
  { key: "chest", label: "Chest", unit: "cm" },
  { key: "thighL", label: "Thigh (L)", unit: "cm" },
  { key: "thighR", label: "Thigh (R)", unit: "cm" },
  { key: "waist", label: "Waist", unit: "cm" },
  { key: "hips", label: "Hips", unit: "cm" },
  { key: "neck", label: "Neck", unit: "cm" },
  { key: "forearmL", label: "Forearm (L)", unit: "cm" },
  { key: "forearmR", label: "Forearm (R)", unit: "cm" },
  { key: "calfL", label: "Calf (L)", unit: "cm" },
  { key: "calfR", label: "Calf (R)", unit: "cm" },
];

const dateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const today = () => dateKey(new Date());
const formatDate = (dk) => {
  const d = new Date(dk + "T12:00:00");
  return d.toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" });
};

// No local storage — all data from Supabase

// ── ICONS ──
const Icons = {
  flame: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  ),
  utensils: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
    </svg>
  ),
  dumbbell: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>
    </svg>
  ),
  footprints: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5 10 7.89 8 10 8 12h0a3.17 3.17 0 0 0-.95 2.69"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 2.39 2 4.5 2 6.5h0a3.17 3.17 0 0 1 .95 2.69"/><path d="M7.1 13 6 15"/><path d="M16.9 17 18 19"/>
    </svg>
  ),
  scale: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M12 2v5"/><path d="M7 12h10"/><circle cx="12" cy="16" r="2"/>
    </svg>
  ),
  camera: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
  ),
  chevL: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>,
  chevR: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  img: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  ),
  spinner: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
      </path>
    </svg>
  ),
};

const tabIcons = [Icons.flame, Icons.utensils, Icons.dumbbell, Icons.footprints, Icons.scale];

// ── STYLES ──
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:wght@700;800&display=swap');

:root {
  --bg: #0a0a0c;
  --surface: #141418;
  --surface2: #1c1c22;
  --surface3: #24242c;
  --border: #2a2a34;
  --text: #eeeef0;
  --text2: #9898a4;
  --text3: #626270;
  --accent: #6ee7b7;
  --accent2: #34d399;
  --accent-dim: rgba(110,231,183,0.1);
  --accent-dim2: rgba(110,231,183,0.06);
  --red: #fb7185;
  --red-dim: rgba(251,113,133,0.12);
  --orange: #fdba74;
  --orange-dim: rgba(253,186,116,0.12);
  --blue: #7dd3fc;
  --blue-dim: rgba(125,211,252,0.12);
  --purple: #c4b5fd;
  --purple-dim: rgba(196,181,253,0.12);
  --yellow: #fde68a;
  --yellow-dim: rgba(253,230,138,0.12);
  --radius: 14px;
  --radius-sm: 10px;
  --font: 'DM Sans', sans-serif;
  --font-display: 'Playfair Display', serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body, #root {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

.app {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: 80px;
}

/* ── TAB BAR ── */
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  display: flex;
  background: rgba(10,10,12,0.92);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--border);
  padding: 6px 8px 12px;
  z-index: 100;
}

.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  background: none;
  border: none;
  color: var(--text3);
  font-family: var(--font);
  font-size: 10px;
  font-weight: 500;
  padding: 6px 4px;
  cursor: pointer;
  transition: color 0.2s;
  letter-spacing: 0.02em;
}
.tab-btn.active { color: var(--accent); }
.tab-btn:hover { color: var(--text2); }
.tab-btn.active:hover { color: var(--accent); }

/* ── HEADER ── */
.page-header {
  padding: 20px 20px 12px;
}
.page-header h1 {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--accent), var(--blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.page-header .subtitle {
  font-size: 13px;
  color: var(--text3);
  margin-top: 2px;
}

/* ── CARDS ── */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  margin: 0 16px 12px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.card-title {
  font-weight: 600;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-title .icon { color: var(--accent); }

/* ── BUTTONS ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  border: none;
  font-family: var(--font);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary {
  background: var(--accent);
  color: var(--bg);
}
.btn-primary:hover { background: var(--accent2); }
.btn-secondary {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--border);
}
.btn-secondary:hover { background: var(--surface3); }
.btn-danger {
  background: var(--red-dim);
  color: var(--red);
}
.btn-sm { padding: 6px 12px; font-size: 12px; }
.btn-icon {
  width: 34px;
  height: 34px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--text2);
  cursor: pointer;
  transition: all 0.2s;
}
.btn-icon:hover { background: var(--surface3); color: var(--text); }

/* ── INPUTS ── */
.input, .textarea {
  width: 100%;
  padding: 10px 14px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-family: var(--font);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.input:focus, .textarea:focus { border-color: var(--accent); }
.input::placeholder, .textarea::placeholder { color: var(--text3); }
.textarea { resize: vertical; min-height: 60px; }
.input-group { display: flex; flex-direction: column; gap: 6px; }
.input-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.input-row { display: flex; gap: 8px; }

/* ── PROGRESS ── */
.progress-ring {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.progress-ring svg { transform: rotate(-90deg); }
.progress-ring .label {
  position: absolute;
  text-align: center;
}
.progress-ring .val { font-size: 22px; font-weight: 700; }
.progress-ring .unit { font-size: 10px; color: var(--text3); }

/* Progress bar */
.progress-bar-bg {
  width: 100%;
  height: 8px;
  background: var(--surface3);
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* ── MEAL ITEMS ── */
.meal-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.meal-item:last-child { border-bottom: none; }
.meal-thumb {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  object-fit: cover;
  background: var(--surface3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text3);
  font-size: 20px;
  overflow: hidden;
}
.meal-thumb img { width: 100%; height: 100%; object-fit: cover; }
.meal-info { flex: 1; min-width: 0; }
.meal-name { font-weight: 600; font-size: 14px; }
.meal-meta { font-size: 12px; color: var(--text3); margin-top: 2px; }
.meal-cals { font-weight: 700; font-size: 15px; color: var(--accent); white-space: nowrap; }
.meal-delete { color: var(--text3); cursor: pointer; padding: 4px; }
.meal-delete:hover { color: var(--red); }

/* ── CALENDAR ── */
.cal-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.cal-nav .month { font-weight: 600; font-size: 15px; }
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.cal-day-label {
  text-align: center;
  font-size: 11px;
  color: var(--text3);
  font-weight: 600;
  padding: 4px 0;
}
.cal-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
  gap: 2px;
  background: var(--surface2);
  border: 1px solid transparent;
}
.cal-day:hover { border-color: var(--border); }
.cal-day.today { border-color: var(--accent); }
.cal-day.selected { background: var(--accent-dim); border-color: var(--accent); }
.cal-day.other-month { opacity: 0.3; }
.cal-day .dots { display: flex; gap: 2px; }
.cal-day .dot { width: 4px; height: 4px; border-radius: 50%; }

/* ── EXERCISE TAGS ── */
.exercise-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.exercise-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.exercise-tag .remove {
  cursor: pointer;
  opacity: 0.6;
  margin-left: 2px;
}
.exercise-tag .remove:hover { opacity: 1; }

/* ── STEP TRACKER ── */
.step-input-area {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
}

/* ── BODY TRACKER ── */
.measurement-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.measurement-row:last-child { border-bottom: none; }
.measurement-label { font-size: 13px; color: var(--text2); }
.measurement-val { font-weight: 600; font-size: 14px; }
.measurement-diff { font-size: 11px; margin-left: 6px; }
.measurement-diff.pos { color: var(--red); }
.measurement-diff.neg { color: var(--accent); }

.photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; }
.photo-item {
  aspect-ratio: 3/4;
  border-radius: var(--radius-sm);
  overflow: hidden;
  position: relative;
  background: var(--surface3);
  cursor: pointer;
}
.photo-item img { width: 100%; height: 100%; object-fit: cover; }
.photo-item .photo-date {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px 6px;
  background: rgba(0,0,0,0.7);
  font-size: 10px;
  text-align: center;
}

/* ── SCHEDULE ── */
.schedule-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.schedule-row:last-child { border-bottom: none; }
.schedule-day {
  width: 36px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text3);
}
.schedule-value { font-size: 13px; flex: 1; }

/* ── MODAL ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 24px 20px 32px;
}
.modal h2 {
  font-family: var(--font-display);
  font-size: 22px;
  margin-bottom: 16px;
}
.modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

/* ── DASHBOARD STATS ── */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 0 16px 12px;
}
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
}
.stat-card .label { font-size: 11px; color: var(--text3); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.stat-card .value { font-size: 24px; font-weight: 700; margin-top: 4px; }
.stat-card .sub { font-size: 11px; color: var(--text3); margin-top: 2px; }

/* ── ANALYZING OVERLAY ── */
.analyzing-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: var(--accent);
}
.analyzing-text { font-size: 14px; color: var(--text2); }

/* Toggle */
.toggle-row {
  display: flex; align-items: center; justify-content: space-between; padding: 8px 0;
}
.toggle-track {
  width: 40px; height: 22px; border-radius: 11px; background: var(--surface3); cursor: pointer; position: relative; transition: background 0.2s;
}
.toggle-track.on { background: var(--accent); }
.toggle-knob {
  width: 18px; height: 18px; border-radius: 50%; background: white; position: absolute; top: 2px; left: 2px; transition: transform 0.2s;
}
.toggle-track.on .toggle-knob { transform: translateX(18px); }

/* File upload area */
.upload-area {
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text3);
}
.upload-area:hover { border-color: var(--accent); color: var(--text2); }
.upload-area.has-preview { padding: 0; border: none; overflow: hidden; border-radius: var(--radius); }
.upload-area img { width: 100%; max-height: 200px; object-fit: cover; }

/* Chip selector */
.chip-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid var(--border);
  background: var(--surface2);
  color: var(--text2);
  cursor: pointer;
  transition: all 0.15s;
}
.chip.active { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }

/* ── ANIMATIONS ── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-up { animation: fadeUp 0.3s ease; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.pulse { animation: pulse 1.5s ease infinite; }

.empty-state {
  text-align: center;
  padding: 32px 16px;
  color: var(--text3);
  font-size: 13px;
}
`;

// ── RING COMPONENT ──
function Ring({ value, max, size = 100, stroke = 8, color = "var(--accent)", children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface3)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div className="label">{children}</div>
    </div>
  );
}

// ── APP WRAPPER WITH AUTH ──
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg, #0a0a0c)", color: "var(--accent, #6ee7b7)" }}>
      {Icons.spinner}
    </div>
  );

  return user ? <FitnessTracker user={user} /> : <Login />;
}

// ── MAIN APP ──
function FitnessTracker({ user }) {
  const [tab, setTab] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Global state
  const [settings, setSettings] = useState({
    calorieGoal: 2200,
    stepGoal: 10000,
    weightGoal: null,
    activeMeasurements: ["weight", "stomach", "bicepL", "bicepR"],
  });
  const [checkins, setCheckins] = useState({});
  const [meals, setMeals] = useState({});
  const [exercises, setExercises] = useState({});
  const [steps, setSteps] = useState({});
  const [bodyEntries, setBodyEntries] = useState([]);
  const [bodyPhotos, setBodyPhotos] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [recurring, setRecurring] = useState({});
  const [challenges, setChallenges] = useState([]);
  const userId = user?.id;

  // Load all data from Supabase
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [s, m, e, st, b, bp, rc, ch] = await Promise.all([
        db.getSettings(userId),
        db.getMeals(userId),
        db.getExercises(userId),
        db.getSteps(userId),
        db.getBodyEntries(userId),
        db.getBodyPhotos(userId),
        db.getRecurring(userId),
        db.getChallenges(userId),
      ]);

      if (s) setSettings(s);
      if (m) setMeals(m);
      if (e) setExercises(e);
      if (st) setSteps(st);
      if (b) setBodyEntries(b);
      if (bp) setBodyPhotos(bp);
      if (rc) setRecurring(rc);
      if (ch) setChallenges(ch);
      setLoaded(true);
    })();
  }, [userId]);

  // ── Update helpers (update local state + persist to Supabase) ──

  const updateSettings = async (s) => {
    setSettings(s);
    if (userId) await db.upsertSettings(userId, s);
  };

  const updateMeals = (m) => { setMeals(m); };
  // For meals, use addMealToDb / removeMealFromDb directly in MealsTab

  const updateExercises = (e) => { setExercises(e); };
  // For exercises, use addExerciseToDb / removeExerciseFromDb directly

  const updateSteps = async (s) => {
    setSteps(s);
    // Find which date changed and upsert
    if (userId) {
      for (const [date, count] of Object.entries(s)) {
        if (count !== (steps[date] || 0)) {
          await db.upsertSteps(userId, date, count);
        }
      }
    }
  };

  const updateBody = (b) => { setBodyEntries(b); };
  const updatePhotos = (p) => { setBodyPhotos(p); };
  const updateRecurring = (r) => { setRecurring(r); };
  const updateChallenges = (c) => { setChallenges(c); };

  const todayMeals = meals[today()] || [];
  const todayCals = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const todaySteps = steps[today()] || 0;

  if (!loaded) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--accent)" }}>
      {Icons.spinner}
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {tab === 0 && <DashboardTab settings={settings} todayCals={todayCals} todaySteps={todaySteps} todayMeals={todayMeals} exercises={exercises} recurring={recurring} challenges={challenges} />}
        {tab === 1 && <MealsTab meals={meals} updateMeals={updateMeals} settings={settings} userId={userId} />}
        {tab === 2 && <ExerciseTab exercises={exercises} updateExercises={updateExercises} schedule={schedule} recurring={recurring} updateRecurring={updateRecurring} challenges={challenges} updateChallenges={updateChallenges} userId={userId} />}
        {tab === 3 && <StepsTab steps={steps} updateSteps={updateSteps} settings={settings} updateSettings={updateSettings} />}
        {tab === 4 && <BodyTab bodyEntries={bodyEntries} updateBody={updateBody} bodyPhotos={bodyPhotos} updatePhotos={updatePhotos} settings={settings} updateSettings={updateSettings} userId={userId} />}

        <div className="tab-bar">
          {TABS.map((t, i) => (
            <button key={t} className={`tab-btn ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>
              {tabIcons[i]}
              <span>{t}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════
// DASHBOARD TAB
// ══════════════════════════════════════════
function DashboardTab({ settings, todayCals, todaySteps, todayMeals, exercises, recurring, challenges }) {
  const todayExercises = exercises[today()] || [];
  const dayIdx = (new Date().getDay() + 6) % 7;

  // Get today's scheduled items from challenge + recurring (same logic as ExerciseTab)
  const activeChallenge = challenges.find(c => c.startDate);
  const getChallengeForToday = () => {
    if (!activeChallenge?.startDate) return null;
    const start = new Date(activeChallenge.startDate + "T00:00:00");
    const current = new Date(today() + "T00:00:00");
    const diffDays = Math.floor((current - start) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return null;
    const weekIdx = Math.floor(diffDays / 7);
    if (weekIdx >= activeChallenge.weeks.length) return null;
    const dayName = WEEKDAYS[dayIdx];
    return { workout: activeChallenge.weeks[weekIdx]?.[dayName] || null, weekIdx };
  };

  const challengeInfo = getChallengeForToday();
  const challengeWorkout = challengeInfo?.workout;
  const currentWeek = challengeInfo?.weekIdx;

  const todayScheduled = [];
  if (challengeWorkout) todayScheduled.push({ name: challengeWorkout, type: "challenge" });
  Object.entries(recurring).forEach(([name, days]) => {
    if (days.includes(dayIdx)) todayScheduled.push({ name, type: "recurring" });
  });

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const totalProtein = todayMeals.reduce((s, m) => s + (m.protein || 0), 0);

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>{greeting}</h1>
        <div className="subtitle">{formatDate(today())}</div>
      </div>

      {/* Rings */}
      <div style={{ display: "flex", justifyContent: "center", gap: 24, padding: "8px 16px 16px" }}>
        <Ring value={todayCals} max={settings.calorieGoal} size={110} color="var(--accent)">
          <div className="val" style={{ color: "var(--accent)" }}>{todayCals}</div>
          <div className="unit">/ {settings.calorieGoal} kcal</div>
        </Ring>
        <Ring value={todaySteps} max={settings.stepGoal} size={110} color="var(--blue)">
          <div className="val" style={{ color: "var(--blue)" }}>{todaySteps.toLocaleString()}</div>
          <div className="unit">/ {settings.stepGoal.toLocaleString()}</div>
        </Ring>
      </div>

      {/* Today's Workouts */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="icon">{Icons.dumbbell}</span> Today's Workouts</div>
          {activeChallenge && currentWeek !== null && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--orange)", background: "var(--orange-dim)", padding: "3px 8px", borderRadius: 12 }}>
              Wk {currentWeek + 1}/{activeChallenge.weeks.length}
            </span>
          )}
        </div>
        {todayScheduled.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {todayScheduled.map((s, i) => {
              const done = todayExercises.some(e => e.name === s.name);
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 12px", borderRadius: "var(--radius-sm)",
                  background: done ? "var(--accent-dim)" : s.type === "challenge" ? "var(--orange-dim)" : "var(--purple-dim)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                      background: done ? "var(--accent)" : "transparent",
                      border: done ? "none" : `2px solid ${s.type === "challenge" ? "var(--orange)" : "var(--purple)"}`,
                      color: done ? "var(--bg)" : "transparent", fontSize: 12,
                    }}>
                      {done ? Icons.check : ""}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: done ? "var(--accent)" : "var(--text)" }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>
                        {s.type === "challenge" ? activeChallenge?.name : "Recurring"}
                      </div>
                    </div>
                  </div>
                  {done && <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>Done</span>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: "16px 0" }}>Rest day — no workouts scheduled</div>
        )}

        {/* Extra logged exercises not in schedule */}
        {todayExercises.filter(e => !todayScheduled.some(s => s.name === e.name)).length > 0 && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Also Logged</div>
            {todayExercises.filter(e => !todayScheduled.some(s => s.name === e.name)).map(e => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                <span style={{ color: "var(--accent)" }}>{Icons.check}</span>
                <span style={{ fontSize: 13 }}>{e.name}</span>
                {e.note && <span style={{ fontSize: 11, color: "var(--text3)" }}>· {e.note}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Meals */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="icon">{Icons.utensils}</span> Today's Meals</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: settings.calorieGoal - todayCals > 0 ? "var(--accent)" : "var(--red)" }}>
            {settings.calorieGoal - todayCals > 0 ? `${settings.calorieGoal - todayCals} left` : `${todayCals - settings.calorieGoal} over`}
          </span>
        </div>
        {todayMeals.length > 0 ? (
          <>
            {todayMeals.map(m => {
              const typeEmoji = m.type === "breakfast" ? "🌅" : m.type === "lunch" ? "☀️" : m.type === "dinner" ? "🌙" : m.type === "snack" ? "🍎" : "🍽";
              return (
              <div key={m.id} className="meal-item">
                <div className="meal-thumb">
                  {m.photo ? <img src={m.photo} alt="" /> : typeEmoji}
                </div>
                <div className="meal-info">
                  <div className="meal-name">{m.name}</div>
                  <div className="meal-meta">{m.type ? m.type.charAt(0).toUpperCase() + m.type.slice(1) : ""}{m.time ? ` · ${m.time}` : ""}</div>
                </div>
                <div className="meal-cals">{m.calories}</div>
              </div>
              );
            })}
            {/* Macro summary */}
            <div style={{ display: "flex", justifyContent: "space-around", paddingTop: 10, marginTop: 8, borderTop: "1px solid var(--border)" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>{totalProtein}g</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>Protein</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{todayCals}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>Calories</div>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ padding: "16px 0" }}>No meals logged yet today</div>
        )}
      </div>

      {/* Quick stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Steps</div>
          <div className="value" style={{ color: "var(--blue)" }}>{todaySteps.toLocaleString()}</div>
          <div className="sub">{todaySteps >= settings.stepGoal ? "Goal hit! 🎉" : `${(settings.stepGoal - todaySteps).toLocaleString()} to go`}</div>
        </div>
        <div className="stat-card">
          <div className="label">Workouts done</div>
          <div className="value">{todayExercises.length}</div>
          <div className="sub">{todayScheduled.filter(s => todayExercises.some(e => e.name === s.name)).length}/{todayScheduled.length} scheduled</div>
        </div>
        <div style={{ margin: "0 16px 12px" }}>
          <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => supabase.auth.signOut()}>
            Sign Out</button>
</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// MEALS TAB
// ══════════════════════════════════════════
function MealsTab({ meals, updateMeals, settings, userId }) {
  const [selectedDate, setSelectedDate] = useState(today());
  const [showAdd, setShowAdd] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [mealForm, setMealForm] = useState({ name: "", calories: "", protein: "", type: "lunch", photo: null });
  const fileRef = useRef();

  const MEAL_TYPES = [
    { key: "breakfast", label: "Breakfast", emoji: "🌅" },
    { key: "lunch", label: "Lunch", emoji: "☀️" },
    { key: "dinner", label: "Dinner", emoji: "🌙" },
    { key: "snack", label: "Snack", emoji: "🍎" },
  ];

  const dayMeals = meals[selectedDate] || [];
  const totalCals = dayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProtein = dayMeals.reduce((s, m) => s + (m.protein || 0), 0);

  // Weekly recap data
  const getWeekDays = () => {
    const d = new Date(selectedDate + "T12:00:00");
    const dayOfWeek = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - dayOfWeek);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(dateKey(day));
    }
    return days;
  };

  const weekDays = getWeekDays();
  const weekTotalCals = weekDays.reduce((s, dk) => s + (meals[dk] || []).reduce((ss, m) => ss + (m.calories || 0), 0), 0);
  const weekTotalProtein = weekDays.reduce((s, dk) => s + (meals[dk] || []).reduce((ss, m) => ss + (m.protein || 0), 0), 0);
  const weekAvgCals = Math.round(weekTotalCals / 7);

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(",")[1];
      const mediaType = file.type || "image/jpeg";
      setMealForm(f => ({ ...f, photo: ev.target.result }));
      setAnalyzing(true);
      try {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
                { type: "text", text: "Analyze this meal photo. Respond ONLY with JSON, no markdown, no backticks: {\"name\": \"meal name\", \"calories\": number, \"protein\": number_grams, \"type\": \"breakfast|lunch|dinner|snack\"}. Estimate portions visible. Be reasonable with estimates. Guess the meal type from the food." }
              ]
            }]
          })
        });
        const data = await resp.json();
        const text = data.content?.map(c => c.text || "").join("") || "";
        const clean = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        setMealForm(f => ({
          ...f,
          name: parsed.name || f.name,
          calories: String(parsed.calories || ""),
          protein: String(parsed.protein || ""),
          type: ["breakfast", "lunch", "dinner", "snack"].includes(parsed.type) ? parsed.type : f.type,
        }));
      } catch (err) {
        console.error("AI analysis failed:", err);
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const addMeal = async () => {
    if (!mealForm.name || !mealForm.calories) return;
    const newMeal = {
      name: mealForm.name,
      calories: parseInt(mealForm.calories) || 0,
      protein: parseInt(mealForm.protein) || 0,
      type: mealForm.type,
      photo: mealForm.photo,
      time: new Date().toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" }),
    };
    // Persist to Supabase
    const saved = await db.addMeal(userId, selectedDate, newMeal);
    const mealWithId = { ...newMeal, id: saved?.id || Date.now() };
    const updated = { ...meals, [selectedDate]: [...dayMeals, mealWithId] };
    updateMeals(updated);
    setMealForm({ name: "", calories: "", protein: "", type: "lunch", photo: null });
    setShowAdd(false);
  };

  const removeMeal = async (id) => {
    await db.deleteMeal(id);
    const updated = { ...meals, [selectedDate]: dayMeals.filter(m => m.id !== id) };
    updateMeals(updated);
  };

  const mealTypeEmoji = (type) => MEAL_TYPES.find(t => t.key === type)?.emoji || "🍽";
  const mealTypeLabel = (type) => MEAL_TYPES.find(t => t.key === type)?.label || "Meal";

  // Group day meals by type for display
  const groupedMeals = MEAL_TYPES.map(t => ({
    ...t,
    meals: dayMeals.filter(m => m.type === t.key),
  })).filter(g => g.meals.length > 0);

  // Ungrouped meals (old data without type)
  const ungroupedMeals = dayMeals.filter(m => !m.type);

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Meals</h1>
        <div className="subtitle">{formatDate(selectedDate)}</div>
      </div>

      {/* Summary ring + remaining */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <Ring value={totalCals} max={settings.calorieGoal} size={80} stroke={6}>
              <div className="val" style={{ fontSize: 18, color: "var(--accent)" }}>{totalCals}</div>
              <div className="unit">kcal</div>
            </Ring>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "var(--text3)" }}>Remaining</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: settings.calorieGoal - totalCals > 0 ? "var(--accent)" : "var(--red)" }}>
              {settings.calorieGoal - totalCals} kcal
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>Protein: {totalProtein}g</div>
          </div>
        </div>
      </div>

      {/* Meals grouped by type */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="icon">{Icons.utensils}</span> Meals</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>{Icons.plus} Add</button>
        </div>
        {dayMeals.length === 0 ? (
          <div className="empty-state">No meals logged yet. Snap a photo or add manually!</div>
        ) : (
          <>
            {groupedMeals.map(group => (
              <div key={group.key}>
                <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <span>{group.emoji}</span> {group.label}
                  <span style={{ marginLeft: "auto", fontWeight: 700, color: "var(--text2)", textTransform: "none", letterSpacing: 0 }}>
                    {group.meals.reduce((s, m) => s + m.calories, 0)} kcal
                  </span>
                </div>
                {group.meals.map(m => (
                  <div key={m.id} className="meal-item">
                    <div className="meal-thumb">
                      {m.photo ? <img src={m.photo} alt="" /> : group.emoji}
                    </div>
                    <div className="meal-info">
                      <div className="meal-name">{m.name}</div>
                      <div className="meal-meta">{m.time && `${m.time} · `}P: {m.protein}g</div>
                    </div>
                    <div className="meal-cals">{m.calories}</div>
                    <button className="meal-delete" onClick={() => removeMeal(m.id)}>{Icons.trash}</button>
                  </div>
                ))}
              </div>
            ))}
            {ungroupedMeals.map(m => (
              <div key={m.id} className="meal-item">
                <div className="meal-thumb">{m.photo ? <img src={m.photo} alt="" /> : "🍽"}</div>
                <div className="meal-info">
                  <div className="meal-name">{m.name}</div>
                  <div className="meal-meta">{m.time && `${m.time} · `}P: {m.protein}g</div>
                </div>
                <div className="meal-cals">{m.calories}</div>
                <button className="meal-delete" onClick={() => removeMeal(m.id)}>{Icons.trash}</button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Date nav + recap button */}
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className="btn-icon" onClick={() => { const d = new Date(selectedDate + "T12:00:00"); d.setDate(d.getDate() - 1); setSelectedDate(dateKey(d)); }}>{Icons.chevL}</button>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{formatDate(selectedDate)}</span>
        <button className="btn-icon" onClick={() => { const d = new Date(selectedDate + "T12:00:00"); d.setDate(d.getDate() + 1); setSelectedDate(dateKey(d)); }}>{Icons.chevR}</button>
      </div>

      <div style={{ margin: "0 16px 12px" }}>
        <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => setShowRecap(true)}>
          📊 Weekly Recap
        </button>
      </div>

      {/* Add meal modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="modal">
            <h2>Add Meal</h2>

            {analyzing ? (
              <div className="analyzing-overlay">
                {Icons.spinner}
                <div className="analyzing-text pulse">Analysing your meal with AI...</div>
              </div>
            ) : (
              <>
                <div className="upload-area" onClick={() => fileRef.current?.click()}>
                  {mealForm.photo ? (
                    <div className="upload-area has-preview">
                      <img src={mealForm.photo} alt="Meal" />
                    </div>
                  ) : (
                    <div style={{ padding: 20 }}>
                      <div style={{ marginBottom: 8 }}>{Icons.camera}</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Snap a photo</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>AI will estimate calories & protein</div>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />

                {/* Meal type selector */}
                <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                  {MEAL_TYPES.map(t => (
                    <button key={t.key} onClick={() => setMealForm(f => ({ ...f, type: t.key }))} style={{
                      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                      padding: "8px 4px", borderRadius: "var(--radius-sm)", cursor: "pointer",
                      border: mealForm.type === t.key ? "2px solid var(--accent)" : "2px solid transparent",
                      background: mealForm.type === t.key ? "var(--accent-dim)" : "var(--surface2)",
                      fontFamily: "var(--font)", transition: "all 0.15s",
                    }}>
                      <span style={{ fontSize: 18 }}>{t.emoji}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: mealForm.type === t.key ? "var(--accent)" : "var(--text3)" }}>{t.label}</span>
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="input-group">
                    <label className="input-label">Meal name</label>
                    <input className="input" placeholder="e.g. Chicken & Rice" value={mealForm.name} onChange={e => setMealForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="input-row">
                    <div className="input-group" style={{ flex: 1 }}>
                      <label className="input-label">Calories</label>
                      <input className="input" type="number" placeholder="kcal" value={mealForm.calories} onChange={e => setMealForm(f => ({ ...f, calories: e.target.value }))} />
                    </div>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label className="input-label">Protein (g)</label>
                      <input className="input" type="number" placeholder="g" value={mealForm.protein} onChange={e => setMealForm(f => ({ ...f, protein: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowAdd(false); setMealForm({ name: "", calories: "", protein: "", type: "lunch", photo: null }); }}>Cancel</button>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={addMeal}>Add Meal</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Weekly Recap Modal */}
      {showRecap && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowRecap(false); }}>
          <div className="modal">
            <h2>Weekly Recap</h2>
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>
              {formatDate(weekDays[0])} — {formatDate(weekDays[6])}
            </div>

            {/* Week summary stats */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1, textAlign: "center", padding: 12, background: "var(--surface2)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>{weekTotalCals.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>Total kcal</div>
              </div>
              <div style={{ flex: 1, textAlign: "center", padding: 12, background: "var(--surface2)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--blue)" }}>{weekAvgCals.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>Avg/day</div>
              </div>
              <div style={{ flex: 1, textAlign: "center", padding: 12, background: "var(--surface2)", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--orange)" }}>{weekTotalProtein}g</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>Protein</div>
              </div>
            </div>

            {/* Day by day bar chart */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
                {weekDays.map(dk => {
                  const dayCals = (meals[dk] || []).reduce((s, m) => s + (m.calories || 0), 0);
                  const maxCals = Math.max(...weekDays.map(d => (meals[d] || []).reduce((s, m) => s + (m.calories || 0), 0)), settings.calorieGoal);
                  const d = new Date(dk + "T12:00:00");
                  return (
                    <div key={dk} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 9, color: "var(--text3)" }}>{dayCals > 0 ? dayCals : ""}</div>
                      <div style={{
                        width: "100%",
                        height: `${Math.max((dayCals / maxCals) * 80, 3)}px`,
                        background: dayCals >= settings.calorieGoal ? "var(--red)" : dayCals > 0 ? "var(--accent)" : "var(--surface3)",
                        borderRadius: 4, transition: "all 0.3s",
                      }} />
                      <div style={{ fontSize: 10, color: dk === today() ? "var(--text)" : "var(--text3)", fontWeight: dk === today() ? 700 : 400 }}>
                        {d.toLocaleDateString("en-IE", { weekday: "short" })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <div style={{ height: 1, flex: 1, background: "var(--accent)", opacity: 0.3 }} />
                <span style={{ fontSize: 10, color: "var(--text3)" }}>Goal: {settings.calorieGoal}</span>
              </div>
            </div>

            {/* Day by day breakdown */}
            {weekDays.map(dk => {
              const dm = meals[dk] || [];
              if (dm.length === 0) return (
                <div key={dk} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(dk)}</span>
                  <span style={{ fontSize: 12, color: "var(--text3)" }}>No meals logged</span>
                </div>
              );
              const dayCals = dm.reduce((s, m) => s + (m.calories || 0), 0);
              const dayProt = dm.reduce((s, m) => s + (m.protein || 0), 0);
              return (
                <div key={dk} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{formatDate(dk)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{dayCals} kcal · {dayProt}g P</span>
                  </div>
                  {dm.map(m => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 4, marginBottom: 3 }}>
                      <span style={{ fontSize: 14 }}>{m.type ? mealTypeEmoji(m.type) : "🍽"}</span>
                      <span style={{ fontSize: 12, color: "var(--text2)", flex: 1 }}>{m.name}</span>
                      <span style={{ fontSize: 11, color: "var(--text3)" }}>{m.calories} kcal</span>
                    </div>
                  ))}
                </div>
              );
            })}

            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowRecap(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// EXERCISE TAB
// ══════════════════════════════════════════
function ExerciseTab({ exercises, updateExercises, schedule, recurring, updateRecurring, challenges, updateChallenges, userId }) {
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today());
  const [showAdd, setShowAdd] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [showNewChallenge, setShowNewChallenge] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [exName, setExName] = useState("");
  const [exNote, setExNote] = useState("");

  // New challenge form
  const [newChName, setNewChName] = useState("");
  const [newChWeeks, setNewChWeeks] = useState(4);

  // New recurring form
  const [newRecName, setNewRecName] = useState("");
  const [newRecDays, setNewRecDays] = useState([]);

  // Find active challenge (one with startDate set)
  const activeChallenge = challenges.find(c => c.startDate);

  // Get current week of active challenge
  const getChallengeWeek = (dk) => {
    if (!activeChallenge?.startDate) return null;
    const start = new Date(activeChallenge.startDate + "T00:00:00");
    const current = new Date(dk + "T00:00:00");
    const diffDays = Math.floor((current - start) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return null;
    const weekIdx = Math.floor(diffDays / 7);
    if (weekIdx >= activeChallenge.weeks.length) return null;
    return weekIdx;
  };

  const getChallengeForDay = (dk) => {
    const weekIdx = getChallengeWeek(dk);
    if (weekIdx === null) return null;
    const d = new Date(dk + "T12:00:00");
    const dayIdx = (d.getDay() + 6) % 7;
    const dayName = WEEKDAYS[dayIdx];
    const workout = activeChallenge.weeks[weekIdx]?.[dayName];
    return workout || null;
  };

  const currentWeek = getChallengeWeek(today());
  const totalWeeks = activeChallenge?.weeks?.length || 0;

  // Challenge completion stats
  const getChallengeCompletionCount = () => {
    if (!activeChallenge?.startDate) return { done: 0, total: 0 };
    let done = 0, total = 0;
    const start = new Date(activeChallenge.startDate + "T00:00:00");
    for (let w = 0; w < activeChallenge.weeks.length; w++) {
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(start);
        dayDate.setDate(dayDate.getDate() + w * 7 + d);
        const dk = dateKey(dayDate);
        const dayName = WEEKDAYS[d];
        const workout = activeChallenge.weeks[w]?.[dayName];
        if (workout) {
          total++;
          const logged = exercises[dk] || [];
          if (logged.some(e => e.name === workout)) done++;
        }
      }
    }
    return { done, total };
  };

  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calDays = [];
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthDays - i);
    calDays.push({ date: d, key: dateKey(d), other: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    calDays.push({ date: d, key: dateKey(d), other: false });
  }
  const rem = 7 - (calDays.length % 7);
  if (rem < 7) {
    for (let i = 1; i <= rem; i++) {
      const d = new Date(year, month + 1, i);
      calDays.push({ date: d, key: dateKey(d), other: true });
    }
  }

  const getExercisesForDay = (dk) => exercises[dk] || [];

  const getScheduleForDay = (dk) => {
    const d = new Date(dk + "T12:00:00");
    const dayIdx = (d.getDay() + 6) % 7;
    const dayName = WEEKDAYS[dayIdx];
    const items = [];
    // Challenge workouts
    const challengeWorkout = getChallengeForDay(dk);
    if (challengeWorkout) items.push({ name: challengeWorkout, type: "challenge" });
    // Recurring
    Object.entries(recurring).forEach(([name, days]) => {
      if (days.includes(dayIdx)) items.push({ name, type: "recurring" });
    });
    return items;
  };

  const dayExercises = getExercisesForDay(selectedDate);
  const dayScheduled = getScheduleForDay(selectedDate);

  const addExercise = async () => {
    if (!exName) return;
    const entry = { name: exName, note: exNote, time: new Date().toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" }) };
    const saved = await db.addExercise(userId, selectedDate, entry);
    const entryWithId = { ...entry, id: saved?.id || Date.now() };
    const updated = { ...exercises, [selectedDate]: [...(exercises[selectedDate] || []), entryWithId] };
    updateExercises(updated);
    setExName("");
    setExNote("");
    setShowAdd(false);
  };

  const removeExercise = async (id) => {
    await db.deleteExercise(id);
    const updated = { ...exercises, [selectedDate]: (exercises[selectedDate] || []).filter(e => e.id !== id) };
    updateExercises(updated);
  };

  const markScheduledDone = async (name) => {
    const entry = { name, note: "From schedule", time: new Date().toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" }) };
    const saved = await db.addExercise(userId, selectedDate, entry);
    const entryWithId = { ...entry, id: saved?.id || Date.now() };
    const updated = { ...exercises, [selectedDate]: [...(exercises[selectedDate] || []), entryWithId] };
    updateExercises(updated);
  };

  const colorForType = (type) => {
    switch(type) {
      case "challenge": return "var(--orange)";
      case "recurring": return "var(--purple)";
      default: return "var(--accent)";
    }
  };

  const startChallengeAction = async (ch) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilMon = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() + daysUntilMon);
    await db.startChallenge(ch.id, dateKey(startDate));
    const updated = challenges.map(c => c.id === ch.id ? { ...c, startDate: dateKey(startDate) } : { ...c, startDate: null });
    updateChallenges(updated);
  };

  const stopChallengeAction = async () => {
    if (activeChallenge) await db.stopChallenge(activeChallenge.id);
    const updated = challenges.map(c => ({ ...c, startDate: null }));
    updateChallenges(updated);
  };

  const deleteChallengeAction = async (id) => {
    await db.deleteChallenge(id);
    updateChallenges(challenges.filter(c => c.id !== id));
  };

  const createChallengeAction = async () => {
    if (!newChName) return;
    const emptyWeek = { Mon: "", Tue: "", Wed: "", Thu: "", Fri: "", Sat: "", Sun: "" };
    const weeks = Array.from({ length: newChWeeks }, () => ({ ...emptyWeek }));
    const saved = await db.createChallenge(userId, newChName, weeks);
    const newCh = { id: saved?.id || Date.now(), name: newChName, startDate: null, weeks };
    updateChallenges([...challenges, newCh]);
    setNewChName("");
    setNewChWeeks(4);
    setShowNewChallenge(false);
    setEditingChallenge(newCh.id);
  };

  const [editingChallenge, setEditingChallenge] = useState(null);
  const [editingWeek, setEditingWeek] = useState(0);

  const editChallengeWeek = async (challengeId, weekIdx, day, value) => {
    const updated = challenges.map(c => {
      if (c.id !== challengeId) return c;
      const weeks = [...c.weeks];
      weeks[weekIdx] = { ...weeks[weekIdx], [day]: value };
      return { ...c, weeks };
    });
    updateChallenges(updated);
    const ch = updated.find(c => c.id === challengeId);
    if (ch) await db.updateChallengeWeek(challengeId, weekIdx + 1, ch.weeks[weekIdx]);
  };

  const addRecurringAction = async () => {
    if (!newRecName || newRecDays.length === 0) return;
    await db.addRecurring(userId, newRecName, newRecDays);
    updateRecurring({ ...recurring, [newRecName]: newRecDays });
    setNewRecName("");
    setNewRecDays([]);
  };

  const removeRecurringAction = async (name) => {
    await db.deleteRecurring(userId, name);
    const updated = { ...recurring };
    delete updated[name];
    updateRecurring(updated);
  };

  const { done: chDone, total: chTotal } = getChallengeCompletionCount();

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Exercise</h1>
        <div className="subtitle">Challenges, workouts & activities</div>
      </div>

      {/* Active Challenge Card */}
      {activeChallenge && currentWeek !== null && (
        <div className="card" style={{ background: "linear-gradient(135deg, rgba(253,186,116,0.08) 0%, rgba(110,231,183,0.06) 100%)", borderColor: "rgba(253,186,116,0.3)" }}>
          <div className="card-header">
            <div className="card-title"><span style={{ color: "var(--orange)" }}>🏆</span> {activeChallenge.name}</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--orange)", background: "var(--orange-dim)", padding: "4px 10px", borderRadius: 20 }}>
              Week {currentWeek + 1}/{totalWeeks}
            </span>
          </div>
          {/* Progress bar */}
          <div className="progress-bar-bg" style={{ marginBottom: 8 }}>
            <div className="progress-bar-fill" style={{
              width: `${((currentWeek + 1) / totalWeeks) * 100}%`,
              background: "linear-gradient(90deg, var(--orange), var(--accent))",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text3)" }}>
            <span>{chDone}/{chTotal} workouts done</span>
            <span>Started {formatDate(activeChallenge.startDate)}</span>
          </div>
          {/* This week's schedule */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>This Week</div>
            <div style={{ display: "flex", gap: 4 }}>
              {WEEKDAYS.map((day, i) => {
                const workout = activeChallenge.weeks[currentWeek]?.[day] || "";
                const abbrev = workout ? (workout === "Sweaty Shredder" ? "SS" : workout === "Toning Power" ? "TP" : workout === "Challenge" ? "C" : workout === "Activity" ? "A" : workout.slice(0, 2).toUpperCase()) : "";
                // Check if done
                const start = new Date(activeChallenge.startDate + "T00:00:00");
                const thisDay = new Date(start);
                thisDay.setDate(start.getDate() + currentWeek * 7 + i);
                const dk = dateKey(thisDay);
                const isDone = (exercises[dk] || []).some(e => e.name === workout);
                const isToday = dk === today();
                return (
                  <div key={day} style={{
                    flex: 1, textAlign: "center", padding: "6px 2px", borderRadius: 8,
                    background: isDone ? "var(--accent-dim)" : isToday ? "var(--orange-dim)" : "var(--surface2)",
                    border: isToday ? "1px solid var(--orange)" : "1px solid transparent",
                  }}>
                    <div style={{ fontSize: 9, color: "var(--text3)", fontWeight: 700 }}>{day}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isDone ? "var(--accent)" : workout ? "var(--text)" : "var(--text3)", marginTop: 2 }}>
                      {isDone ? "✓" : abbrev || "–"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="card">
        <div className="cal-nav">
          <button className="btn-icon" onClick={() => setCalMonth(new Date(year, month - 1))}>{Icons.chevL}</button>
          <span className="month">{calMonth.toLocaleDateString("en-IE", { month: "long", year: "numeric" })}</span>
          <button className="btn-icon" onClick={() => setCalMonth(new Date(year, month + 1))}>{Icons.chevR}</button>
        </div>
        <div className="cal-grid">
          {WEEKDAYS.map(d => <div key={d} className="cal-day-label">{d}</div>)}
          {calDays.map(({ key: dk, other }) => {
            const logged = getExercisesForDay(dk);
            const sched = getScheduleForDay(dk);
            const isToday = dk === today();
            const isSelected = dk === selectedDate;
            return (
              <div key={dk} className={`cal-day ${other ? "other-month" : ""} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedDate(dk)}>
                <span>{parseInt(dk.split("-")[2])}</span>
                <div className="dots">
                  {sched.map((s, i) => <span key={i} className="dot" style={{ background: colorForType(s.type) }} />)}
                  {logged.length > 0 && <span className="dot" style={{ background: "var(--accent)" }} />}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8, justifyContent: "center", fontSize: 10, color: "var(--text3)" }}>
          <span><span className="dot" style={{ display: "inline-block", width: 6, height: 6, borderRadius: 3, background: "var(--orange)", marginRight: 4, verticalAlign: "middle" }} />Challenge</span>
          <span><span className="dot" style={{ display: "inline-block", width: 6, height: 6, borderRadius: 3, background: "var(--purple)", marginRight: 4, verticalAlign: "middle" }} />Recurring</span>
          <span><span className="dot" style={{ display: "inline-block", width: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginRight: 4, verticalAlign: "middle" }} />Logged</span>
        </div>
      </div>

      {/* Selected day */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="icon">{Icons.dumbbell}</span> {formatDate(selectedDate)}</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>{Icons.plus} Log</button>
        </div>

        {dayScheduled.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Scheduled</div>
            <div className="exercise-tags">
              {dayScheduled.map((s, i) => {
                const done = dayExercises.some(e => e.name === s.name);
                return (
                  <span key={i} className="exercise-tag" style={{ background: done ? "var(--accent-dim)" : `${colorForType(s.type)}22`, color: done ? "var(--accent)" : colorForType(s.type) }}>
                    {done && <span style={{ marginRight: 2 }}>{Icons.check}</span>}
                    {s.name}
                    {!done && (
                      <span className="remove" onClick={() => markScheduledDone(s.name)} title="Mark done" style={{ cursor: "pointer" }}>{Icons.check}</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {dayExercises.length > 0 ? (
          dayExercises.map(e => (
            <div key={e.id} className="meal-item">
              <div className="meal-info">
                <div className="meal-name">{e.name}</div>
                <div className="meal-meta">{e.time}{e.note ? ` · ${e.note}` : ""}</div>
              </div>
              <button className="meal-delete" onClick={() => removeExercise(e.id)}>{Icons.trash}</button>
            </div>
          ))
        ) : (
          <div className="empty-state">No exercises logged for this day.</div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ margin: "0 16px 12px", display: "flex", gap: 8 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowChallenge(true)}>🏆 Challenges</button>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowRecurring(true)}>🔁 Recurring</button>
      </div>

      {/* Add Exercise Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="modal">
            <h2>Log Exercise</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="input-group">
                <label className="input-label">Exercise</label>
                <input className="input" placeholder="e.g. Running, Yoga" value={exName} onChange={e => setExName(e.target.value)} />
              </div>
              {dayScheduled.length > 0 && (
                <div className="chip-grid">
                  {dayScheduled.map((s, i) => (
                    <span key={i} className={`chip ${exName === s.name ? "active" : ""}`} onClick={() => setExName(s.name)}>{s.name}</span>
                  ))}
                </div>
              )}
              <div className="input-group">
                <label className="input-label">Notes (optional)</label>
                <input className="input" placeholder="e.g. 5km, 30 mins" value={exNote} onChange={e => setExNote(e.target.value)} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={addExercise}>Log</button>
            </div>
          </div>
        </div>
      )}

      {/* Challenges Modal */}
      {showChallenge && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowChallenge(false); setEditingChallenge(null); }}}>
          <div className="modal">
            {editingChallenge ? (() => {
              const ch = challenges.find(c => c.id === editingChallenge);
              if (!ch) return null;
              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <button className="btn-icon" onClick={() => setEditingChallenge(null)}>{Icons.chevL}</button>
                    <h2 style={{ margin: 0 }}>{ch.name}</h2>
                  </div>
                  {/* Week tabs */}
                  <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
                    {ch.weeks.map((_, i) => (
                      <button key={i} className={`chip ${editingWeek === i ? "active" : ""}`}
                        onClick={() => setEditingWeek(i)} style={{ minWidth: 50 }}>
                        Wk {i + 1}
                      </button>
                    ))}
                    <button className="chip" onClick={async () => {
                      const emptyWeek = { Mon: "", Tue: "", Wed: "", Thu: "", Fri: "", Sat: "", Sun: "" };
                      const newWeekNum = ch.weeks.length + 1;
                      await db.addChallengeWeek(ch.id, newWeekNum);
                      const updated = challenges.map(c => c.id === ch.id ? { ...c, weeks: [...c.weeks, { ...emptyWeek }] } : c);
                      updateChallenges(updated);
                    }} style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>{Icons.plus}</button>
                  </div>
                  {/* Edit week schedule */}
                  {WEEKDAYS.map(day => (
                    <div key={day} className="schedule-row">
                      <div className="schedule-day">{day}</div>
                      <input className="input" style={{ flex: 1 }} value={ch.weeks[editingWeek]?.[day] || ""} placeholder="Rest day"
                        onChange={e => editChallengeWeek(ch.id, editingWeek, day, e.target.value)} />
                    </div>
                  ))}
                  <div style={{ marginTop: 8, fontSize: 11, color: "var(--text3)" }}>
                    Tip: Use SS, TP, C, A as shorthand — or type full names like "Sweaty Shredder"
                  </div>
                </>
              );
            })() : showNewChallenge ? (
              <>
                <h2>New Challenge</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="input-group">
                    <label className="input-label">Challenge Name</label>
                    <input className="input" placeholder="e.g. Summer Shred" value={newChName} onChange={e => setNewChName(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Number of Weeks</label>
                    <input className="input" type="number" min="1" max="52" value={newChWeeks} onChange={e => setNewChWeeks(parseInt(e.target.value) || 4)} />
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowNewChallenge(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={createChallengeAction}>Create</button>
                </div>
              </>
            ) : (
              <>
                <h2>Challenges</h2>
                {challenges.length === 0 ? (
                  <div className="empty-state">No challenges yet. Create one!</div>
                ) : (
                  challenges.map(ch => (
                    <div key={ch.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{ch.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text3)" }}>
                            {ch.weeks.length} weeks
                            {ch.startDate ? ` · Started ${formatDate(ch.startDate)}` : " · Not started"}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setEditingChallenge(ch.id); setEditingWeek(0); }}>Edit</button>
                          {ch.startDate ? (
                            <button className="btn btn-danger btn-sm" onClick={stopChallengeAction}>Stop</button>
                          ) : (
                            <button className="btn btn-primary btn-sm" onClick={() => startChallengeAction(ch)}>Start</button>
                          )}
                        </div>
                      </div>
                      {!ch.startDate && (
                        <button style={{ fontSize: 11, color: "var(--red)", background: "none", border: "none", cursor: "pointer", marginTop: 4, fontFamily: "var(--font)" }}
                          onClick={() => deleteChallengeAction(ch.id)}>Delete challenge</button>
                      )}
                    </div>
                  ))
                )}
                <div className="modal-actions">
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowChallenge(false); setEditingChallenge(null); }}>Close</button>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowNewChallenge(true)}>{Icons.plus} New Challenge</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Recurring Modal */}
      {showRecurring && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowRecurring(false); }}>
          <div className="modal">
            <h2>Recurring Activities</h2>
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>Activities that repeat on set days each week</div>

            {Object.entries(recurring).length === 0 ? (
              <div className="empty-state" style={{ padding: "16px 0" }}>No recurring activities set.</div>
            ) : (
              Object.entries(recurring).map(([name, days]) => (
                <div key={name} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--purple)" }}>{name}</div>
                    <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                      {days.map(d => WEEKDAYS[d]).join(", ") || "No days set"}
                    </div>
                  </div>
                  <button className="meal-delete" onClick={() => removeRecurringAction(name)}>{Icons.trash}</button>
                </div>
              ))
            )}

            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 8 }}>Add New</div>
              <div className="input-group" style={{ marginBottom: 8 }}>
                <input className="input" placeholder="Activity name (e.g. Yoga, Running)" value={newRecName} onChange={e => setNewRecName(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {WEEKDAYS.map((day, i) => (
                  <button key={day} className={`chip ${newRecDays.includes(i) ? "active" : ""}`}
                    onClick={() => setNewRecDays(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i])}
                    style={{ flex: 1, textAlign: "center", padding: "8px 2px" }}>
                    {day}
                  </button>
                ))}
              </div>
              <button className="btn btn-primary btn-sm" style={{ width: "100%" }} onClick={addRecurringAction} disabled={!newRecName || newRecDays.length === 0}>
                Add Recurring
              </button>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowRecurring(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// STEPS TAB
// ══════════════════════════════════════════
function StepsTab({ steps, updateSteps, settings, updateSettings }) {
  const [selectedDate, setSelectedDate] = useState(today());
  const [input, setInput] = useState("");
  const [editGoal, setEditGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(settings.stepGoal));

  const val = steps[selectedDate] || 0;
  const pct = Math.min((val / settings.stepGoal) * 100, 100);

  // Last 7 days
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dk = dateKey(d);
    last7.push({ date: dk, steps: steps[dk] || 0, label: d.toLocaleDateString("en-IE", { weekday: "short" }) });
  }
  const maxSteps = Math.max(...last7.map(d => d.steps), settings.stepGoal);

  const saveSteps = () => {
    if (!input) return;
    updateSteps({ ...steps, [selectedDate]: parseInt(input) || 0 });
    setInput("");
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Steps</h1>
        <div className="subtitle">{formatDate(selectedDate)}</div>
      </div>

      <div className="card" style={{ textAlign: "center" }}>
        <Ring value={val} max={settings.stepGoal} size={140} stroke={10} color="var(--blue)">
          <div className="val" style={{ color: "var(--blue)", fontSize: 26 }}>{val.toLocaleString()}</div>
          <div className="unit">steps</div>
        </Ring>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, color: val >= settings.stepGoal ? "var(--accent)" : "var(--text3)" }}>
            {val >= settings.stepGoal ? "Goal reached! 🎉" : `${(settings.stepGoal - val).toLocaleString()} to go`}
          </div>
        </div>

        <div className="step-input-area" style={{ justifyContent: "center" }}>
          <input className="input" type="number" placeholder="Enter steps" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && saveSteps()} style={{ maxWidth: 160 }} />
          <button className="btn btn-primary btn-sm" onClick={saveSteps}>Log</button>
        </div>
      </div>

      {/* Bar chart */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 12 }}>Last 7 Days</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
          {last7.map(d => (
            <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 10, color: "var(--text3)" }}>{d.steps > 0 ? (d.steps / 1000).toFixed(1) + "k" : ""}</div>
              <div style={{
                width: "100%",
                height: `${Math.max((d.steps / maxSteps) * 90, 4)}px`,
                background: d.steps >= settings.stepGoal ? "var(--accent)" : "var(--blue)",
                borderRadius: 4,
                opacity: d.date === selectedDate ? 1 : 0.5,
                transition: "all 0.3s",
                cursor: "pointer",
              }} onClick={() => setSelectedDate(d.date)} />
              <div style={{ fontSize: 10, color: d.date === today() ? "var(--text)" : "var(--text3)", fontWeight: d.date === today() ? 700 : 400 }}>{d.label}</div>
            </div>
          ))}
        </div>
        {/* Goal line indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <div style={{ height: 2, flex: 1, background: "var(--accent)", opacity: 0.3 }} />
          <span style={{ fontSize: 11, color: "var(--text3)" }}>Goal: {settings.stepGoal.toLocaleString()}</span>
        </div>
      </div>

      {/* Date nav */}
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className="btn-icon" onClick={() => { const d = new Date(selectedDate + "T12:00:00"); d.setDate(d.getDate() - 1); setSelectedDate(dateKey(d)); }}>{Icons.chevL}</button>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{formatDate(selectedDate)}</span>
        <button className="btn-icon" onClick={() => { const d = new Date(selectedDate + "T12:00:00"); d.setDate(d.getDate() + 1); setSelectedDate(dateKey(d)); }}>{Icons.chevR}</button>
      </div>

      {/* Goal setting */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Daily Goal</div>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditGoal(!editGoal)}>
            {editGoal ? "Close" : "Edit"}
          </button>
        </div>
        {editGoal ? (
          <div className="input-row">
            <input className="input" type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={() => {
              updateSettings({ ...settings, stepGoal: parseInt(goalInput) || 10000 });
              setEditGoal(false);
            }}>Save</button>
          </div>
        ) : (
          <div style={{ fontSize: 22, fontWeight: 700 }}>{settings.stepGoal.toLocaleString()} <span style={{ fontSize: 13, color: "var(--text3)", fontWeight: 400 }}>steps/day</span></div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// BODY TAB
// ══════════════════════════════════════════
function BodyTab({ bodyEntries, updateBody, bodyPhotos, updatePhotos, settings, updateSettings, userId }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [formMeasurements, setFormMeasurements] = useState({});
  const [formPhoto, setFormPhoto] = useState(null);
  const [formDate, setFormDate] = useState(today());
  const [editGoal, setEditGoal] = useState(false);
  const [calGoalInput, setCalGoalInput] = useState(String(settings.calorieGoal));
  const [editWeightGoal, setEditWeightGoal] = useState(false);
  const [weightGoalInput, setWeightGoalInput] = useState(String(settings.weightGoal || ""));
  const fileRef = useRef();

  const activeMeasures = MEASUREMENT_OPTIONS.filter(m => settings.activeMeasurements.includes(m.key));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFormPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const addEntry = async () => {
    const saved = await db.addBodyEntry(userId, formDate, formMeasurements);
    const entry = { id: saved?.id || Date.now(), date: formDate, measurements: { ...formMeasurements } };
    const updated = [...bodyEntries, entry].sort((a, b) => a.date.localeCompare(b.date));
    updateBody(updated);
    if (formPhoto) {
      // For Supabase Storage, you'd upload the file first with db.uploadPhoto
      // For now, store the base64 URL directly
      await db.addBodyPhoto(userId, formDate, formPhoto, saved?.id);
      const photo = { id: Date.now(), date: formDate, src: formPhoto };
      updatePhotos([...bodyPhotos, photo]);
    }
    setFormMeasurements({});
    setFormPhoto(null);
    setFormDate(today());
    setShowAdd(false);
  };

  const removeEntry = async (id) => {
    await db.deleteBodyEntry(id);
    updateBody(bodyEntries.filter(e => e.id !== id));
  };

  const toggleMeasurement = (key) => {
    const active = settings.activeMeasurements.includes(key)
      ? settings.activeMeasurements.filter(k => k !== key)
      : [...settings.activeMeasurements, key];
    updateSettings({ ...settings, activeMeasurements: active });
  };

  const latestEntry = bodyEntries.length > 0 ? bodyEntries[bodyEntries.length - 1] : null;
  const prevEntry = bodyEntries.length > 1 ? bodyEntries[bodyEntries.length - 2] : null;
  const currentWeight = latestEntry?.measurements?.weight;
  const goalWeight = settings.weightGoal;

  // Weight chart data
  const weightEntries = bodyEntries.filter(e => e.measurements?.weight);
  const minW = weightEntries.length > 0 ? Math.min(...weightEntries.map(e => e.measurements.weight)) - 2 : 0;
  const maxW = weightEntries.length > 0 ? Math.max(...weightEntries.map(e => e.measurements.weight)) + 2 : 100;

  // Progress toward weight goal
  const firstWeight = weightEntries.length > 0 ? weightEntries[0].measurements.weight : null;
  const weightProgress = (firstWeight && currentWeight && goalWeight)
    ? Math.min(Math.max(Math.abs(firstWeight - currentWeight) / Math.abs(firstWeight - goalWeight), 0), 1)
    : 0;

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Body</h1>
        <div className="subtitle">Measurements & progress photos</div>
      </div>

      {/* Weight Goal Hero */}
      <div className="card" style={{ background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)" }}>
        <div className="card-header">
          <div className="card-title"><span className="icon">{Icons.scale}</span> Weight Journey</div>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditWeightGoal(!editWeightGoal)}>
            {editWeightGoal ? "Close" : "Set Goal"}
          </button>
        </div>
        {editWeightGoal ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="input-group">
              <label className="input-label">Goal weight (kg)</label>
              <input className="input" type="number" step="0.1" placeholder="e.g. 75" value={weightGoalInput}
                onChange={e => setWeightGoalInput(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => {
              updateSettings({ ...settings, weightGoal: parseFloat(weightGoalInput) || null });
              setEditWeightGoal(false);
            }}>Save Goal</button>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Current</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>{currentWeight ? `${currentWeight} kg` : "—"}</div>
              </div>
              {goalWeight && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Goal</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "var(--accent)" }}>{goalWeight} kg</div>
                </div>
              )}
            </div>
            {goalWeight && currentWeight && (
              <div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{
                    width: `${weightProgress * 100}%`,
                    background: weightProgress >= 1 ? "var(--accent)" : "linear-gradient(90deg, var(--blue), var(--accent))",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>
                    {Math.abs(currentWeight - goalWeight).toFixed(1)} kg to go
                  </span>
                  <span style={{ fontSize: 11, color: weightProgress >= 1 ? "var(--accent)" : "var(--text3)" }}>
                    {weightProgress >= 1 ? "Goal reached! 🎉" : `${(weightProgress * 100).toFixed(0)}% there`}
                  </span>
                </div>
              </div>
            )}
            {!goalWeight && (
              <div style={{ fontSize: 12, color: "var(--text3)", fontStyle: "italic" }}>Set a goal weight to track your progress</div>
            )}
          </div>
        )}
      </div>

      {/* Latest measurements */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="icon">{Icons.scale}</span> Latest</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>{Icons.plus} Log</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowSettings(true)}>⚙</button>
          </div>
        </div>
        {latestEntry ? (
          <div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>{formatDate(latestEntry.date)}</div>
            {activeMeasures.map(m => {
              const val = latestEntry.measurements?.[m.key];
              const prevVal = prevEntry?.measurements?.[m.key];
              const diff = val && prevVal ? val - prevVal : null;
              return (
                <div key={m.key} className="measurement-row">
                  <div className="measurement-label">{m.label}</div>
                  <div>
                    <span className="measurement-val">{val ? `${val} ${m.unit}` : "—"}</span>
                    {diff !== null && diff !== 0 && (
                      <span className={`measurement-diff ${diff > 0 ? (m.key === "weight" ? "pos" : "neg") : (m.key === "weight" ? "neg" : "pos")}`}>
                        {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">No measurements logged yet. Start tracking!</div>
        )}
      </div>

      {/* Weight chart */}
      {weightEntries.length > 1 && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Weight Trend</div>
          <svg width="100%" viewBox="0 0 400 150" style={{ overflow: "visible" }}>
            <defs>
              <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(p => (
              <g key={p}>
                <line x1="30" y1={10 + p * 120} x2="390" y2={10 + p * 120} stroke="var(--border)" strokeWidth="0.5" />
                <text x="26" y={14 + p * 120} fill="var(--text3)" fontSize="9" textAnchor="end">
                  {(maxW - p * (maxW - minW)).toFixed(0)}
                </text>
              </g>
            ))}
            {/* Area */}
            <path d={
              weightEntries.map((e, i) => {
                const x = 30 + (i / (weightEntries.length - 1)) * 360;
                const y = 10 + ((maxW - e.measurements.weight) / (maxW - minW)) * 120;
                return `${i === 0 ? "M" : "L"}${x},${y}`;
              }).join(" ") + `L${30 + 360},130 L30,130 Z`
            } fill="url(#wg)" />
            {/* Line */}
            <path d={
              weightEntries.map((e, i) => {
                const x = 30 + (i / (weightEntries.length - 1)) * 360;
                const y = 10 + ((maxW - e.measurements.weight) / (maxW - minW)) * 120;
                return `${i === 0 ? "M" : "L"}${x},${y}`;
              }).join(" ")
            } fill="none" stroke="var(--accent)" strokeWidth="2" />
            {/* Points */}
            {weightEntries.map((e, i) => {
              const x = 30 + (i / (weightEntries.length - 1)) * 360;
              const y = 10 + ((maxW - e.measurements.weight) / (maxW - minW)) * 120;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill="var(--accent)" />
                  <text x={x} y={y - 10} fill="var(--text2)" fontSize="9" textAnchor="middle">{e.measurements.weight}</text>
                </g>
              );
            })}
            {/* Date labels */}
            {weightEntries.map((e, i) => {
              const x = 30 + (i / (weightEntries.length - 1)) * 360;
              return (
                <text key={i} x={x} y={148} fill="var(--text3)" fontSize="8" textAnchor="middle">
                  {e.date.slice(5)}
                </text>
              );
            })}
          </svg>
        </div>
      )}

      {/* Progress Photos */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 8 }}>{Icons.img} <span style={{ marginLeft: 8 }}>Progress Photos</span></div>
        {bodyPhotos.length > 0 ? (
          <div className="photo-grid">
            {bodyPhotos.map(p => (
              <div key={p.id} className="photo-item">
                <img src={p.src} alt="" />
                <div className="photo-date">{formatDate(p.date)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Upload progress photos when logging measurements</div>
        )}
      </div>

      {/* History */}
      {bodyEntries.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 8 }}>History</div>
          {[...bodyEntries].reverse().map(e => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{formatDate(e.date)}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>
                  {activeMeasures.filter(m => e.measurements?.[m.key]).map(m => `${m.label}: ${e.measurements[m.key]}${m.unit}`).join(" · ")}
                </div>
              </div>
              <button className="meal-delete" onClick={() => removeEntry(e.id)}>{Icons.trash}</button>
            </div>
          ))}
        </div>
      )}

      {/* Calorie goal */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Calorie Goal</div>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditGoal(!editGoal)}>{editGoal ? "Close" : "Edit"}</button>
        </div>
        {editGoal ? (
          <div className="input-row">
            <input className="input" type="number" value={calGoalInput} onChange={e => setCalGoalInput(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={() => {
              updateSettings({ ...settings, calorieGoal: parseInt(calGoalInput) || 2200 });
              setEditGoal(false);
            }}>Save</button>
          </div>
        ) : (
          <div style={{ fontSize: 22, fontWeight: 700 }}>{settings.calorieGoal} <span style={{ fontSize: 13, color: "var(--text3)", fontWeight: 400 }}>kcal/day</span></div>
        )}
      </div>

      {/* Add Entry Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="modal">
            <h2>Log Measurements</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="input-group">
                <label className="input-label">Date</label>
                <input className="input" type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
              </div>

              {activeMeasures.map(m => (
                <div key={m.key} className="input-group">
                  <label className="input-label">{m.label} ({m.unit})</label>
                  <input className="input" type="number" step="0.1" placeholder={`e.g. ${m.key === "weight" ? "82.5" : "90"}`}
                    value={formMeasurements[m.key] || ""}
                    onChange={e => setFormMeasurements(f => ({ ...f, [m.key]: parseFloat(e.target.value) || "" }))} />
                </div>
              ))}

              <div className="input-group">
                <label className="input-label">Progress Photo (optional)</label>
                <div className="upload-area" onClick={() => fileRef.current?.click()}>
                  {formPhoto ? (
                    <div className="upload-area has-preview"><img src={formPhoto} alt="" /></div>
                  ) : (
                    <div style={{ padding: 16 }}>
                      <div>{Icons.camera}</div>
                      <div style={{ fontSize: 13, marginTop: 4 }}>Tap to upload photo</div>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowAdd(false); setFormMeasurements({}); setFormPhoto(null); }}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={addEntry}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Measurements Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowSettings(false); }}>
          <div className="modal">
            <h2>Measurements</h2>
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>Choose what to track</div>
            {MEASUREMENT_OPTIONS.map(m => (
              <div key={m.key} className="toggle-row">
                <div style={{ fontSize: 14 }}>{m.label} <span style={{ color: "var(--text3)", fontSize: 12 }}>({m.unit})</span></div>
                <div className={`toggle-track ${settings.activeMeasurements.includes(m.key) ? "on" : ""}`}
                  onClick={() => toggleMeasurement(m.key)}>
                  <div className="toggle-knob" />
                </div>
              </div>
            ))}
            <div className="modal-actions">
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowSettings(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}