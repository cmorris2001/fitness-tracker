import { useState, useRef } from "react";
import { Icons, Ring, MEAL_TYPES, today, dateKey, formatDate } from "../lib/shared";
import * as db from "../lib/Db";

export default function MealsTab({ meals, updateMeals, settings, userId }) {
  const [selectedDate, setSelectedDate] = useState(today());
  const [showAdd, setShowAdd] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [mealForm, setMealForm] = useState({ name: "", calories: "", protein: "", type: "lunch", photo: null });
  const fileRef = useRef();

  const dayMeals = meals[selectedDate] || [];
  const totalCals = dayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProtein = dayMeals.reduce((s, m) => s + (m.protein || 0), 0);

  // Weekly recap
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
                { type: "text", text: 'Analyze this meal photo. Respond ONLY with JSON, no markdown, no backticks: {"name": "meal name", "calories": number, "protein": number_grams, "type": "breakfast|lunch|dinner|snack"}. Estimate portions visible. Be reasonable with estimates. Guess the meal type from the food.' }
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

  const groupedMeals = MEAL_TYPES.map(t => ({
    ...t,
    meals: dayMeals.filter(m => m.type === t.key),
  })).filter(g => g.meals.length > 0);

  const ungroupedMeals = dayMeals.filter(m => !m.type);

  return (
    <div className="fade-up">
      <div className="page-header">
        <h1>Meals</h1>
        <div className="subtitle">{formatDate(selectedDate)}</div>
      </div>

      {/* Summary ring */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Ring value={totalCals} max={settings.calorieGoal} size={80} stroke={6}>
            <div className="val" style={{ fontSize: 18, color: "var(--accent)" }}>{totalCals}</div>
            <div className="unit">kcal</div>
          </Ring>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "var(--text3)" }}>Remaining</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: settings.calorieGoal - totalCals > 0 ? "var(--accent)" : "var(--red)" }}>
              {settings.calorieGoal - totalCals} kcal
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>Protein: {totalProtein}g</div>
          </div>
        </div>
      </div>

      {/* Meals list */}
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
                    <div className="meal-thumb">{m.photo ? <img src={m.photo} alt="" /> : group.emoji}</div>
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

      {/* Date nav */}
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className="btn-icon" onClick={() => { const d = new Date(selectedDate + "T12:00:00"); d.setDate(d.getDate() - 1); setSelectedDate(dateKey(d)); }}>{Icons.chevL}</button>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{formatDate(selectedDate)}</span>
        <button className="btn-icon" onClick={() => { const d = new Date(selectedDate + "T12:00:00"); d.setDate(d.getDate() + 1); setSelectedDate(dateKey(d)); }}>{Icons.chevR}</button>
      </div>

      <div style={{ margin: "0 16px 12px" }}>
        <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => setShowRecap(true)}>📊 Weekly Recap</button>
      </div>

      {/* Add Meal Modal */}
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
                    <div className="upload-area has-preview"><img src={mealForm.photo} alt="Meal" /></div>
                  ) : (
                    <div style={{ padding: 20 }}>
                      <div style={{ marginBottom: 8 }}>{Icons.camera}</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Snap a photo</div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>AI will estimate calories & protein</div>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />

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

            {/* Bar chart */}
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

            {/* Day breakdown */}
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