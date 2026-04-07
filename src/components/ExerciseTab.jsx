import { useState } from "react";
import { Icons, WEEKDAYS, today, dateKey, formatDate } from "../lib/shared";
import * as db from "../lib/Db";

export default function ExerciseTab({ exercises, updateExercises, recurring, updateRecurring, challenges, updateChallenges, userId }) {
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today());
  const [showAdd, setShowAdd] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [showNewChallenge, setShowNewChallenge] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [exName, setExName] = useState("");
  const [exNote, setExNote] = useState("");
  const [newChName, setNewChName] = useState("");
  const [newChWeeks, setNewChWeeks] = useState(4);
  const [newRecName, setNewRecName] = useState("");
  const [newRecDays, setNewRecDays] = useState([]);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [editingWeek, setEditingWeek] = useState(0);

  const activeChallenge = challenges.find(c => c.startDate);

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
    return activeChallenge.weeks[weekIdx]?.[WEEKDAYS[dayIdx]] || null;
  };

  const currentWeek = getChallengeWeek(today());
  const totalWeeks = activeChallenge?.weeks?.length || 0;

  const getChallengeCompletionCount = () => {
    if (!activeChallenge?.startDate) return { done: 0, total: 0 };
    let done = 0, total = 0;
    const start = new Date(activeChallenge.startDate + "T00:00:00");
    for (let w = 0; w < activeChallenge.weeks.length; w++) {
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(start);
        dayDate.setDate(dayDate.getDate() + w * 7 + d);
        const dk = dateKey(dayDate);
        const workout = activeChallenge.weeks[w]?.[WEEKDAYS[d]];
        if (workout) {
          total++;
          if ((exercises[dk] || []).some(e => e.name === workout)) done++;
        }
      }
    }
    return { done, total };
  };

  // Calendar
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

  const getScheduleForDay = (dk) => {
    const d = new Date(dk + "T12:00:00");
    const dayIdx = (d.getDay() + 6) % 7;
    const items = [];
    const challengeWorkout = getChallengeForDay(dk);
    if (challengeWorkout) items.push({ name: challengeWorkout, type: "challenge" });
    Object.entries(recurring).forEach(([name, days]) => {
      if (days.includes(dayIdx)) items.push({ name, type: "recurring" });
    });
    return items;
  };

  const dayExercises = exercises[selectedDate] || [];
  const dayScheduled = getScheduleForDay(selectedDate);

  const addExercise = async () => {
    if (!exName) return;
    const entry = { name: exName, note: exNote, time: new Date().toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" }) };
    const saved = await db.addExercise(userId, selectedDate, entry);
    const entryWithId = { ...entry, id: saved?.id || Date.now() };
    updateExercises({ ...exercises, [selectedDate]: [...(exercises[selectedDate] || []), entryWithId] });
    setExName(""); setExNote(""); setShowAdd(false);
  };

  const removeExercise = async (id) => {
    await db.deleteExercise(id);
    updateExercises({ ...exercises, [selectedDate]: (exercises[selectedDate] || []).filter(e => e.id !== id) });
  };

  const markScheduledDone = async (name) => {
    const entry = { name, note: "From schedule", time: new Date().toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" }) };
    const saved = await db.addExercise(userId, selectedDate, entry);
    const entryWithId = { ...entry, id: saved?.id || Date.now() };
    updateExercises({ ...exercises, [selectedDate]: [...(exercises[selectedDate] || []), entryWithId] });
  };

  const colorForType = (type) => type === "challenge" ? "var(--orange)" : type === "recurring" ? "var(--purple)" : "var(--accent)";

  const startChallengeAction = async (ch) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - daysSinceMonday);
    await db.startChallenge(ch.id, dateKey(startDate));
    updateChallenges(challenges.map(c => c.id === ch.id ? { ...c, startDate: dateKey(startDate) } : { ...c, startDate: null }));
  };

  const stopChallengeAction = async () => {
    if (activeChallenge) await db.stopChallenge(activeChallenge.id);
    updateChallenges(challenges.map(c => ({ ...c, startDate: null })));
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
    updateChallenges([...challenges, { id: saved?.id || Date.now(), name: newChName, startDate: null, weeks }]);
    setNewChName(""); setNewChWeeks(4); setShowNewChallenge(false);
    setEditingChallenge(saved?.id || null);
  };

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
    setNewRecName(""); setNewRecDays([]);
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
          <div className="progress-bar-bg" style={{ marginBottom: 8 }}>
            <div className="progress-bar-fill" style={{ width: `${((currentWeek + 1) / totalWeeks) * 100}%`, background: "linear-gradient(90deg, var(--orange), var(--accent))" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text3)" }}>
            <span>{chDone}/{chTotal} workouts done</span>
            <span>Started {formatDate(activeChallenge.startDate)}</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>This Week</div>
            <div style={{ display: "flex", gap: 4 }}>
              {WEEKDAYS.map((day, i) => {
                const workout = activeChallenge.weeks[currentWeek]?.[day] || "";
                const abbrev = workout ? (workout === "Sweaty Shredder" ? "SS" : workout === "Toning Power" ? "TP" : workout === "Challenge" ? "C" : workout === "Activity" ? "A" : workout.slice(0, 2).toUpperCase()) : "";
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
            const logged = exercises[dk] || [];
            const sched = getScheduleForDay(dk);
            return (
              <div key={dk} className={`cal-day ${other ? "other-month" : ""} ${dk === today() ? "today" : ""} ${dk === selectedDate ? "selected" : ""}`}
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
                    {!done && <span className="remove" onClick={() => markScheduledDone(s.name)} title="Mark done">{Icons.check}</span>}
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
                  <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
                    {ch.weeks.map((_, i) => (
                      <button key={i} className={`chip ${editingWeek === i ? "active" : ""}`} onClick={() => setEditingWeek(i)} style={{ minWidth: 50 }}>Wk {i + 1}</button>
                    ))}
                    <button className="chip" onClick={async () => {
                      const newWeekNum = ch.weeks.length + 1;
                      await db.addChallengeWeek(ch.id, newWeekNum);
                      const emptyWeek = { Mon: "", Tue: "", Wed: "", Thu: "", Fri: "", Sat: "", Sun: "" };
                      updateChallenges(challenges.map(c => c.id === ch.id ? { ...c, weeks: [...c.weeks, { ...emptyWeek }] } : c));
                    }} style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>{Icons.plus}</button>
                  </div>
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
                            {ch.weeks.length} weeks{ch.startDate ? ` · Started ${formatDate(ch.startDate)}` : " · Not started"}
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
                    <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{days.map(d => WEEKDAYS[d]).join(", ")}</div>
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
                    style={{ flex: 1, textAlign: "center", padding: "8px 2px" }}>{day}</button>
                ))}
              </div>
              <button className="btn btn-primary btn-sm" style={{ width: "100%" }} onClick={addRecurringAction} disabled={!newRecName || newRecDays.length === 0}>Add Recurring</button>
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