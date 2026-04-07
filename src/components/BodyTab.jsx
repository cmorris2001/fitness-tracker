import { useState, useRef } from "react";
import { Icons, Ring, MEASUREMENT_OPTIONS, today, formatDate } from "../lib/shared";
import * as db from "../lib/Db";

export default function BodyTab({ bodyEntries, updateBody, bodyPhotos, updatePhotos, settings, updateSettings, userId }) {
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
      await db.addBodyPhoto(userId, formDate, formPhoto, saved?.id);
      updatePhotos([...bodyPhotos, { id: Date.now(), date: formDate, src: formPhoto }]);
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

  const weightEntries = bodyEntries.filter(e => e.measurements?.weight);
  const minW = weightEntries.length > 0 ? Math.min(...weightEntries.map(e => e.measurements.weight)) - 2 : 0;
  const maxW = weightEntries.length > 0 ? Math.max(...weightEntries.map(e => e.measurements.weight)) + 2 : 100;

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
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>{Math.abs(currentWeight - goalWeight).toFixed(1)} kg to go</span>
                  <span style={{ fontSize: 11, color: weightProgress >= 1 ? "var(--accent)" : "var(--text3)" }}>
                    {weightProgress >= 1 ? "Goal reached! 🎉" : `${(weightProgress * 100).toFixed(0)}% there`}
                  </span>
                </div>
              </div>
            )}
            {!goalWeight && <div style={{ fontSize: 12, color: "var(--text3)", fontStyle: "italic" }}>Set a goal weight to track your progress</div>}
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
            {[0, 0.25, 0.5, 0.75, 1].map(p => (
              <g key={p}>
                <line x1="30" y1={10 + p * 120} x2="390" y2={10 + p * 120} stroke="var(--border)" strokeWidth="0.5" />
                <text x="26" y={14 + p * 120} fill="var(--text3)" fontSize="9" textAnchor="end">{(maxW - p * (maxW - minW)).toFixed(0)}</text>
              </g>
            ))}
            <path d={
              weightEntries.map((e, i) => {
                const x = 30 + (i / (weightEntries.length - 1)) * 360;
                const y = 10 + ((maxW - e.measurements.weight) / (maxW - minW)) * 120;
                return `${i === 0 ? "M" : "L"}${x},${y}`;
              }).join(" ") + `L${30 + 360},130 L30,130 Z`
            } fill="url(#wg)" />
            <path d={
              weightEntries.map((e, i) => {
                const x = 30 + (i / (weightEntries.length - 1)) * 360;
                const y = 10 + ((maxW - e.measurements.weight) / (maxW - minW)) * 120;
                return `${i === 0 ? "M" : "L"}${x},${y}`;
              }).join(" ")
            } fill="none" stroke="var(--accent)" strokeWidth="2" />
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
            {weightEntries.map((e, i) => {
              const x = 30 + (i / (weightEntries.length - 1)) * 360;
              return <text key={i} x={x} y={148} fill="var(--text3)" fontSize="8" textAnchor="middle">{e.date.slice(5)}</text>;
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
