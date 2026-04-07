import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import * as db from "./lib/Db";
import { TABS, Icons, tabIcons, css, today } from "./lib/shared";
import Login from "./components/Login";
import DashboardTab from "./components/DashboardTab";
import MealsTab from "./components/MealsTab";
import ExerciseTab from "./components/ExerciseTab";
import StepsTab from "./components/StepsTab";
import BodyTab from "./components/BodyTab";

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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0c", color: "#6ee7b7" }}>
      {Icons.spinner}
    </div>
  );

  return (
    <>
      <style>{css}</style>
      {user ? <FitnessTracker user={user} /> : <Login />}
    </>
  );
}

// ── MAIN APP ──
function FitnessTracker({ user }) {
  const [tab, setTab] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const [settings, setSettings] = useState({
    calorieGoal: 2200,
    stepGoal: 10000,
    weightGoal: null,
    activeMeasurements: ["weight", "stomach", "bicepL", "bicepR"],
  });
  const [meals, setMeals] = useState({});
  const [exercises, setExercises] = useState({});
  const [steps, setSteps] = useState({});
  const [bodyEntries, setBodyEntries] = useState([]);
  const [bodyPhotos, setBodyPhotos] = useState([]);
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

  // ── Update helpers ──

  const updateSettings = async (s) => {
    setSettings(s);
    if (userId) await db.upsertSettings(userId, s);
  };

  const updateSteps = async (s) => {
    setSteps(s);
    if (userId) {
      for (const [date, count] of Object.entries(s)) {
        if (count !== (steps[date] || 0)) {
          await db.upsertSteps(userId, date, count);
        }
      }
    }
  };

  const todayMeals = meals[today()] || [];
  const todayCals = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const todaySteps = steps[today()] || 0;

  if (!loaded) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--accent)" }}>
      {Icons.spinner}
    </div>
  );

  return (
    <div className="app">
      {tab === 0 && <DashboardTab settings={settings} todayCals={todayCals} todaySteps={todaySteps} todayMeals={todayMeals} exercises={exercises} recurring={recurring} challenges={challenges} />}
      {tab === 1 && <MealsTab meals={meals} updateMeals={setMeals} settings={settings} userId={userId} />}
      {tab === 2 && <ExerciseTab exercises={exercises} updateExercises={setExercises} recurring={recurring} updateRecurring={setRecurring} challenges={challenges} updateChallenges={setChallenges} userId={userId} />}
      {tab === 3 && <StepsTab steps={steps} updateSteps={updateSteps} settings={settings} updateSettings={updateSettings} />}
      {tab === 4 && <BodyTab bodyEntries={bodyEntries} updateBody={setBodyEntries} bodyPhotos={bodyPhotos} updatePhotos={setBodyPhotos} settings={settings} updateSettings={updateSettings} userId={userId} />}

      <div className="tab-bar">
        {TABS.map((t, i) => (
          <button key={t} className={`tab-btn ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>
            {tabIcons[i]}
            <span>{t}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
