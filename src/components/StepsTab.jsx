import { useState } from "react";
import { Icons, Ring, today, dateKey, formatDate } from "../lib/shared";

export default function StepsTab({ steps, updateSteps, settings, updateSettings }) {
  const [selectedDate, setSelectedDate] = useState(today());
  const [input, setInput] = useState("");
  const [editGoal, setEditGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(settings.stepGoal));

  const val = steps[selectedDate] || 0;

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
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", marginTop: 12 }}>
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
          <button className="btn btn-secondary btn-sm" onClick={() => setEditGoal(!editGoal)}>{editGoal ? "Close" : "Edit"}</button>
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
