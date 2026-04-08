// ─────────────────────────────────────────────────────
// Shared constants, helpers, icons, and styles
// ─────────────────────────────────────────────────────

export const TABS = ["Dashboard", "Meals", "Exercise", "Steps", "Body"];
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const MEASUREMENT_OPTIONS = [
  { key: "weight", label: "Weight", unit: "kg" },
  { key: "stomach", label: "Stomach", unit: "in" },
  { key: "bicepL", label: "Bicep (L)", unit: "in" },
  { key: "bicepR", label: "Bicep (R)", unit: "in" },
  { key: "chest", label: "Chest", unit: "in" },
  { key: "thighL", label: "Thigh (L)", unit: "in" },
  { key: "thighR", label: "Thigh (R)", unit: "in" },
  { key: "waist", label: "Waist", unit: "in" },
  { key: "hips", label: "Hips", unit: "in" },
  { key: "neck", label: "Neck", unit: "in" },
  { key: "forearmL", label: "Forearm (L)", unit: "in" },
  { key: "forearmR", label: "Forearm (R)", unit: "in" },
  { key: "calfL", label: "Calf (L)", unit: "in" },
  { key: "calfR", label: "Calf (R)", unit: "in" },
];

export const MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast", emoji: "🌅" },
  { key: "lunch", label: "Lunch", emoji: "☀️" },
  { key: "dinner", label: "Dinner", emoji: "🌙" },
  { key: "snack", label: "Snack", emoji: "🍎" },
];

// ── DATE HELPERS ──

export const dateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const today = () => dateKey(new Date());

export const formatDate = (dk) => {
  const d = new Date(dk + "T12:00:00");
  return d.toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" });
};

// ── ICONS ──

export const Icons = {
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

export const tabIcons = [Icons.flame, Icons.utensils, Icons.dumbbell, Icons.footprints, Icons.scale];

// ── RING COMPONENT ──

export function Ring({ value, max, size = 100, stroke = 8, color = "var(--accent)", children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface3)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease", transform: "rotate(-90deg)", transformOrigin: "center" }} />
      </svg>
      <div className="label">{children}</div>
    </div>
  );
}

// ── STYLES ──

export const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:wght@700;800&display=swap');

:root {
  --bg: #1a1a2e;
  --surface: #2a2a3e;
  --surface2: #2d2d3f;
  --surface3: #35354a;
  --border: #3a3a4a;
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
.page-header { padding: 20px 20px 12px; }
.page-header h1 {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--accent), var(--blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.page-header .subtitle { font-size: 13px; color: var(--text3); margin-top: 2px; }

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
.btn-primary { background: var(--accent); color: var(--bg); }
.btn-primary:hover { background: var(--accent2); }
.btn-secondary {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--border);
}
.btn-secondary:hover { background: var(--surface3); }
.btn-danger { background: var(--red-dim); color: var(--red); }
.btn-sm { padding: 6px 12px; font-size: 12px; }
.btn-icon {
  width: 34px; height: 34px; padding: 0;
  display: flex; align-items: center; justify-content: center;
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
  font-size: 12px; font-weight: 600; color: var(--text2);
  text-transform: uppercase; letter-spacing: 0.06em;
}
.input-row { display: flex; gap: 8px; }

/* ── PROGRESS ── */
.progress-ring {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.progress-ring .label {
  position: absolute;
  text-align: center;
}
.progress-ring .val { font-size: 22px; font-weight: 700; }
.progress-ring .unit { font-size: 10px; color: var(--text3); }

.progress-bar-bg {
  width: 100%; height: 8px;
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
  width: 48px; height: 48px;
  border-radius: 10px;
  object-fit: cover;
  background: var(--surface3);
  display: flex; align-items: center; justify-content: center;
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
.meal-delete { color: var(--text3); cursor: pointer; padding: 4px; background: none; border: none; }
.meal-delete:hover { color: var(--red); }

/* ── CALENDAR ── */
.cal-nav {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
}
.cal-nav .month { font-weight: 600; font-size: 15px; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.cal-day-label {
  text-align: center; font-size: 11px; color: var(--text3); font-weight: 600; padding: 4px 0;
}
.cal-day {
  aspect-ratio: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  border-radius: 10px; font-size: 13px; cursor: pointer;
  transition: all 0.15s; position: relative; gap: 2px;
  background: var(--surface2); border: 1px solid transparent;
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
  display: flex; align-items: center; gap: 4px;
  padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
}
.exercise-tag .remove { cursor: pointer; opacity: 0.6; margin-left: 2px; }
.exercise-tag .remove:hover { opacity: 1; }

/* ── BODY TRACKER ── */
.measurement-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 0; border-bottom: 1px solid var(--border);
}
.measurement-row:last-child { border-bottom: none; }
.measurement-label { font-size: 13px; color: var(--text2); }
.measurement-val { font-weight: 600; font-size: 14px; }
.measurement-diff { font-size: 11px; margin-left: 6px; }
.measurement-diff.pos { color: var(--red); }
.measurement-diff.neg { color: var(--accent); }

.photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; }
.photo-item {
  aspect-ratio: 3/4; border-radius: var(--radius-sm); overflow: hidden;
  position: relative; background: var(--surface3); cursor: pointer;
}
.photo-item img { width: 100%; height: 100%; object-fit: cover; }
.photo-item .photo-date {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 4px 6px; background: rgba(0,0,0,0.7); font-size: 10px; text-align: center;
}

/* ── SCHEDULE ── */
.schedule-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 0; border-bottom: 1px solid var(--border);
}
.schedule-row:last-child { border-bottom: none; }
.schedule-day { width: 36px; font-size: 12px; font-weight: 700; color: var(--text3); }

/* ── MODAL ── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
  z-index: 200;
  display: flex; align-items: flex-end; justify-content: center;
}
.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px 20px 0 0;
  width: 100%; max-width: 480px; max-height: 85vh;
  overflow-y: auto;
  padding: 24px 20px 32px;
}
.modal h2 {
  font-family: var(--font-display);
  font-size: 22px; margin-bottom: 16px;
}
.modal-actions { display: flex; gap: 8px; margin-top: 16px; }

/* ── DASHBOARD STATS ── */
.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 0 16px 12px; }
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
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 40px 20px; color: var(--accent);
}
.analyzing-text { font-size: 14px; color: var(--text2); }

/* Toggle */
.toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; }
.toggle-track {
  width: 40px; height: 22px; border-radius: 11px; background: var(--surface3);
  cursor: pointer; position: relative; transition: background 0.2s;
}
.toggle-track.on { background: var(--accent); }
.toggle-knob {
  width: 18px; height: 18px; border-radius: 50%; background: white;
  position: absolute; top: 2px; left: 2px; transition: transform 0.2s;
}
.toggle-track.on .toggle-knob { transform: translateX(18px); }

/* File upload area */
.upload-area {
  border: 2px dashed var(--border); border-radius: var(--radius);
  padding: 24px; text-align: center; cursor: pointer;
  transition: all 0.2s; color: var(--text3);
}
.upload-area:hover { border-color: var(--accent); color: var(--text2); }
.upload-area.has-preview { padding: 0; border: none; overflow: hidden; border-radius: var(--radius); }
.upload-area img { width: 100%; max-height: 200px; object-fit: cover; }

/* Chip selector */
.chip-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
  border: 1px solid var(--border); background: var(--surface2); color: var(--text2);
  cursor: pointer; transition: all 0.15s;
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
  text-align: center; padding: 32px 16px; color: var(--text3); font-size: 13px;
}
`;
