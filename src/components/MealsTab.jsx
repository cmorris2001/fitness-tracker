import { useState, useRef, useEffect } from "react";
import { Icons, Ring, MEAL_TYPES, today, dateKey, formatDate } from "../lib/shared";
import * as db from "../lib/Db";

// ── AI CHAT MEAL LOGGER ──
function AIMealChat({ onConfirm, fileRef }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hey! What did you eat? You can describe it or snap a photo 📸" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [editingProposal, setEditingProposal] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const chatEndRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, proposal]);

  const callAI = async (userMessages, imageData = null) => {
    const systemPrompt = `You are FitAI, a friendly meal logging assistant. When the user describes what they ate, analyze it and respond ONLY with a JSON object (no markdown, no backticks, no extra text):
{"name": "combined meal name", "calories": total_number, "protein": total_grams, "type": "breakfast|lunch|dinner|snack", "breakdown": "brief breakdown of how you calculated it"}

Rules:
- Combine all items into ONE meal entry with a descriptive name
- Pay close attention to high-calorie ingredients such as cheese, sauces, oils, and bread. 
  Do not underestimate these — use realistic portion sizes
- Infer the meal type from context (time mentions, food type)
- If the user says "breakfast" or mentions morning, set type to "breakfast"
- If unclear, guess based on the food
- The "breakdown" should be a short 1-2 sentence explanation like "4 eggs (~280 cal, 24g protein) + americano (~5 cal, 0g protein)"
- Always respond with ONLY the JSON, nothing else`;

    const content = [];
    if (imageData) {
      content.push({ type: "image", source: { type: "base64", media_type: imageData.mediaType, data: imageData.base64 } });
    }
    const conversationText = userMessages.map(m => `${m.role}: ${m.text}`).join("\n");
    content.push({ type: "text", text: conversationText });

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content }]
      })
    });
    const data = await resp.json();
    const text = data.content?.map(c => c.text || "").join("") || "";
    return text.replace(/```json|```/g, "").trim();
  };

  const handleSend = async () => {
    if (!input.trim() && !photoPreview) return;
    const userMsg = { role: "user", text: input.trim() || "Here's a photo of my meal" };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      let imageData = null;
      if (photoPreview) {
        imageData = {
          base64: photoPreview.split(",")[1],
          mediaType: "image/jpeg",
        };
      }

      const aiResponse = await callAI(
        newMessages.filter(m => m.role === "user"),
        imageData
      );
      const parsed = JSON.parse(aiResponse);
      setProposal(parsed);
      setEditingProposal({
        name: parsed.name || "",
        calories: String(parsed.calories || ""),
        protein: String(parsed.protein || ""),
        type: parsed.type || "lunch",
      });
      setMessages(prev => [...prev, {
        role: "assistant",
        text: parsed.breakdown || "Here's what I estimated:"
      }]);
    } catch (err) {
      console.error("AI parsing failed:", err);
      setMessages(prev => [...prev, {
        role: "assistant",
        text: "Hmm, I couldn't quite figure that out. Could you describe it a bit more? Like what foods and roughly how much?"
      }]);
    }
    setPhotoPreview(null);
    setLoading(false);
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (!editingProposal) return;
    onConfirm({
      name: editingProposal.name,
      calories: parseInt(editingProposal.calories) || 0,
      protein: parseInt(editingProposal.protein) || 0,
      type: editingProposal.type,
      photo: null,
    });
  };

  const handleRetry = () => {
    setProposal(null);
    setEditingProposal(null);
    setMessages(prev => [...prev, {
      role: "assistant",
      text: "No worries! Tell me again what you had and I'll re-estimate."
    }]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "70vh", maxHeight: "70vh" }}>
      {/* Chat messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 0 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
          }}>
            <div style={{
              padding: "10px 14px",
              borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: m.role === "user" ? "var(--accent)" : "var(--surface2)",
              color: m.role === "user" ? "var(--bg)" : "var(--text)",
              fontSize: 14, lineHeight: 1.5,
            }}>
              {m.role === "assistant" && i === 0 && <span style={{ marginRight: 4 }}>🤖</span>}
              {m.text}
            </div>
          </div>
        ))}

        {photoPreview && (
          <div style={{ alignSelf: "flex-end", maxWidth: "60%" }}>
            <div style={{ borderRadius: 14, overflow: "hidden", border: "2px solid var(--accent)" }}>
              <img src={photoPreview} alt="Meal" style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }} />
            </div>
          </div>
        )}

        {loading && (
          <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "var(--surface2)" }}>
            <span style={{ color: "var(--accent)" }}>{Icons.spinner}</span>
            <span className="pulse" style={{ fontSize: 13, color: "var(--text2)" }}>Analysing...</span>
          </div>
        )}

        {/* Confirmation card */}
        {proposal && editingProposal && !loading && (
          <div style={{ alignSelf: "flex-start", width: "100%", marginTop: 4 }}>
            <div style={{
              background: "var(--surface2)", border: "1px solid var(--accent)",
              borderRadius: 14, padding: 16,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                {Icons.check} Review & Confirm
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Meal Name</label>
                <input className="input" value={editingProposal.name}
                  onChange={e => setEditingProposal(p => ({ ...p, name: e.target.value }))}
                  style={{ marginTop: 4 }} />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Meal Type</label>
                <div style={{ display: "flex", gap: 4 }}>
                  {MEAL_TYPES.map(t => (
                    <button key={t.key} onClick={() => setEditingProposal(p => ({ ...p, type: t.key }))} style={{
                      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                      padding: "6px 2px", borderRadius: 8, cursor: "pointer",
                      border: editingProposal.type === t.key ? "2px solid var(--accent)" : "2px solid transparent",
                      background: editingProposal.type === t.key ? "var(--accent-dim)" : "var(--surface3)",
                      fontFamily: "var(--font)", transition: "all 0.15s",
                    }}>
                      <span style={{ fontSize: 14 }}>{t.emoji}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: editingProposal.type === t.key ? "var(--accent)" : "var(--text3)" }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Calories</label>
                  <input className="input" type="number" value={editingProposal.calories}
                    onChange={e => setEditingProposal(p => ({ ...p, calories: e.target.value }))}
                    style={{ marginTop: 4, fontSize: 18, fontWeight: 700, textAlign: "center" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Protein (g)</label>
                  <input className="input" type="number" value={editingProposal.protein}
                    onChange={e => setEditingProposal(p => ({ ...p, protein: e.target.value }))}
                    style={{ marginTop: 4, fontSize: 18, fontWeight: 700, textAlign: "center" }} />
                </div>
              </div>

              {proposal.breakdown && (
                <div style={{ fontSize: 11, color: "var(--text3)", padding: "8px 10px", background: "var(--surface3)", borderRadius: 8, marginBottom: 12, lineHeight: 1.5 }}>
                  💡 {proposal.breakdown}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={handleRetry}>Redo</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleConfirm}>{Icons.check} Log Meal</button>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      {!proposal && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <button className="btn-icon" onClick={() => fileRef.current?.click()} style={{ flexShrink: 0 }}>
            {Icons.camera}
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
          <input
            ref={inputRef}
            className="input"
            placeholder="e.g. 4 eggs and coffee for breakfast"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !loading && handleSend()}
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary btn-sm" onClick={handleSend}
            disabled={loading || (!input.trim() && !photoPreview)}
            style={{ flexShrink: 0, padding: "10px 14px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}


// ── MAIN MEALS TAB ──
export default function MealsTab({ meals, updateMeals, settings, userId }) {
  const [selectedDate, setSelectedDate] = useState(today());
  const [showAdd, setShowAdd] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [addMode, setAddMode] = useState("ai");

  const [analyzing, setAnalyzing] = useState(false);
  const [mealForm, setMealForm] = useState({ name: "", calories: "", protein: "", type: "lunch", photo: null });
  const fileRef = useRef();
  const aiFileRef = useRef();

  const dayMeals = meals[selectedDate] || [];
  const totalCals = dayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProtein = dayMeals.reduce((s, m) => s + (m.protein || 0), 0);

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
          headers: {
            "Content-Type": "application/json",
            "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
                { type: "text", text: 'Analyze this meal photo. Respond ONLY with JSON, no markdown, no backticks: {"name": "meal name", "calories": number, "protein": number_grams, "type": "breakfast|lunch|dinner|snack"}. Estimate portions visible. Pay close attention to high-calorie ingredients such as cheese, sauces, oils, and bread. Do not underestimate these — use realistic portion sizes. Guess the meal type from the food.' }
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

  const saveMeal = async (mealData) => {
    const newMeal = {
      ...mealData,
      time: new Date().toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" }),
    };
    const saved = await db.addMeal(userId, selectedDate, newMeal);
    const mealWithId = { ...newMeal, id: saved?.id || Date.now() };
    const updated = { ...meals, [selectedDate]: [...dayMeals, mealWithId] };
    updateMeals(updated);
    resetAndClose();
  };

  const addMealManual = async () => {
    if (!mealForm.name || !mealForm.calories) return;
    await saveMeal({
      name: mealForm.name,
      calories: parseInt(mealForm.calories) || 0,
      protein: parseInt(mealForm.protein) || 0,
      type: mealForm.type,
      photo: mealForm.photo,
    });
  };

  const resetAndClose = () => {
    setShowAdd(false);
    setAddMode("ai");
    setMealForm({ name: "", calories: "", protein: "", type: "lunch", photo: null });
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
          <div className="empty-state">No meals logged yet. Tell FitAI what you ate!</div>
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

      {/* ═══ ADD MEAL MODAL ═══ */}
      {showAdd && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) resetAndClose(); }}>
          <div className="modal">
            {/* Mode toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>{addMode === "ai" ? "🤖 FitAI" : "✏️ Manual"}</h2>
              <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 8, padding: 2, border: "1px solid var(--border)" }}>
                <button onClick={() => setAddMode("ai")} style={{
                  padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontFamily: "var(--font)", fontSize: 12, fontWeight: 600,
                  background: addMode === "ai" ? "var(--accent)" : "transparent",
                  color: addMode === "ai" ? "var(--bg)" : "var(--text3)",
                  transition: "all 0.15s",
                }}>🤖 AI</button>
                <button onClick={() => setAddMode("manual")} style={{
                  padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontFamily: "var(--font)", fontSize: 12, fontWeight: 600,
                  background: addMode === "manual" ? "var(--accent)" : "transparent",
                  color: addMode === "manual" ? "var(--bg)" : "var(--text3)",
                  transition: "all 0.15s",
                }}>✏️ Manual</button>
              </div>
            </div>

            {/* AI MODE */}
            {addMode === "ai" && (
              <AIMealChat onConfirm={saveMeal} fileRef={aiFileRef} />
            )}

            {/* MANUAL MODE */}
            {addMode === "manual" && (
              <>
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
                      <button className="btn btn-secondary" style={{ flex: 1 }} onClick={resetAndClose}>Cancel</button>
                      <button className="btn btn-primary" style={{ flex: 1 }} onClick={addMealManual}>Add Meal</button>
                    </div>
                  </>
                )}
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