import { Icons, Ring, WEEKDAYS, today, formatDate } from "../lib/shared";
import { supabase } from "../lib/supabaseClient";

export default function DashboardTab({ settings, todayCals, todaySteps, todayMeals, exercises, recurring, challenges }) {
  const todayExercises = exercises[today()] || [];
  const dayIdx = (new Date().getDay() + 6) % 7;

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
                      width: 24, height: 24, borderRadius: 12,
                      display: "flex", alignItems: "center", justifyContent: "center",
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
                  <div className="meal-thumb">{m.photo ? <img src={m.photo} alt="" /> : typeEmoji}</div>
                  <div className="meal-info">
                    <div className="meal-name">{m.name}</div>
                    <div className="meal-meta">{m.type ? m.type.charAt(0).toUpperCase() + m.type.slice(1) : ""}{m.time ? ` · ${m.time}` : ""}</div>
                  </div>
                  <div className="meal-cals">{m.calories}</div>
                </div>
              );
            })}
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
      </div>

      <div style={{ margin: "0 16px 12px" }}>
        <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => supabase.auth.signOut()}>
          Sign Out
        </button>
      </div>
    </div>
  );
}