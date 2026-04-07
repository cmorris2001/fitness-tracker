// Db.js
// ─────────────────────────────────────────────────────
// Data access functions for all Supabase tables
// ─────────────────────────────────────────────────────

import { supabase } from "./supabaseClient";

// ── AUTH HELPERS ──

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserId() {
  const user = await getUser();
  return user?.id || null;
}

// ── SETTINGS ──

export async function getSettings(userId) {
  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    calorieGoal: data.calorie_goal,
    stepGoal: data.step_goal,
    weightGoal: data.weight_goal,
    activeMeasurements: data.active_measurements,
  };
}

export async function upsertSettings(userId, settings) {
  await supabase.from("user_settings").upsert({
    user_id: userId,
    calorie_goal: settings.calorieGoal,
    step_goal: settings.stepGoal,
    weight_goal: settings.weightGoal,
    active_measurements: settings.activeMeasurements,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}

// ── MEALS ──

export async function getMeals(userId) {
  const { data } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });
  const grouped = {};
  (data || []).forEach(m => {
    const dk = m.date;
    if (!grouped[dk]) grouped[dk] = [];
    grouped[dk].push({
      id: m.id,
      name: m.name,
      calories: m.calories,
      protein: m.protein,
      type: m.meal_type,
      photo: m.photo_url,
      time: m.time_logged ? m.time_logged.slice(0, 5) : null,
    });
  });
  return grouped;
}

export async function addMeal(userId, date, meal) {
  const { data } = await supabase.from("meals").insert({
    user_id: userId,
    date,
    meal_type: meal.type || "lunch",
    name: meal.name,
    calories: meal.calories,
    protein: meal.protein,
    photo_url: meal.photo || null,
    time_logged: meal.time ? meal.time + ":00" : null,
  }).select().single();
  return data;
}

export async function deleteMeal(mealId) {
  await supabase.from("meals").delete().eq("id", mealId);
}

// ── EXERCISES ──

export async function getExercises(userId) {
  const { data } = await supabase
    .from("exercises")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });
  const grouped = {};
  (data || []).forEach(e => {
    const dk = e.date;
    if (!grouped[dk]) grouped[dk] = [];
    grouped[dk].push({
      id: e.id,
      name: e.name,
      note: e.note,
      time: e.time_logged ? e.time_logged.slice(0, 5) : null,
    });
  });
  return grouped;
}

export async function addExercise(userId, date, exercise) {
  const { data } = await supabase.from("exercises").insert({
    user_id: userId,
    date,
    name: exercise.name,
    note: exercise.note || null,
    time_logged: exercise.time ? exercise.time + ":00" : null,
  }).select().single();
  return data;
}

export async function deleteExercise(exerciseId) {
  await supabase.from("exercises").delete().eq("id", exerciseId);
}

// ── STEPS ──

export async function getSteps(userId) {
  const { data } = await supabase
    .from("steps")
    .select("*")
    .eq("user_id", userId);
  const mapped = {};
  (data || []).forEach(s => { mapped[s.date] = s.count; });
  return mapped;
}

export async function upsertSteps(userId, date, count) {
  await supabase.from("steps").upsert({
    user_id: userId,
    date,
    count,
  }, { onConflict: "user_id,date" });
}

// ── BODY ENTRIES ──

export async function getBodyEntries(userId) {
  const { data } = await supabase
    .from("body_entries")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });
  return (data || []).map(e => ({
    id: e.id,
    date: e.date,
    measurements: {
      weight: e.weight,
      stomach: e.stomach,
      bicepL: e.bicep_l,
      bicepR: e.bicep_r,
      chest: e.chest,
      thighL: e.thigh_l,
      thighR: e.thigh_r,
      waist: e.waist,
      hips: e.hips,
      neck: e.neck,
      forearmL: e.forearm_l,
      forearmR: e.forearm_r,
      calfL: e.calf_l,
      calfR: e.calf_r,
    },
  }));
}

export async function addBodyEntry(userId, date, measurements) {
  const { data } = await supabase.from("body_entries").insert({
    user_id: userId,
    date,
    weight: measurements.weight || null,
    stomach: measurements.stomach || null,
    bicep_l: measurements.bicepL || null,
    bicep_r: measurements.bicepR || null,
    chest: measurements.chest || null,
    thigh_l: measurements.thighL || null,
    thigh_r: measurements.thighR || null,
    waist: measurements.waist || null,
    hips: measurements.hips || null,
    neck: measurements.neck || null,
    forearm_l: measurements.forearmL || null,
    forearm_r: measurements.forearmR || null,
    calf_l: measurements.calfL || null,
    calf_r: measurements.calfR || null,
  }).select().single();
  return data;
}

export async function deleteBodyEntry(entryId) {
  await supabase.from("body_entries").delete().eq("id", entryId);
}

// ── BODY PHOTOS ──

export async function getBodyPhotos(userId) {
  const { data } = await supabase
    .from("body_photos")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });
  return (data || []).map(p => ({
    id: p.id,
    date: p.date,
    src: p.photo_url,
  }));
}

export async function addBodyPhoto(userId, date, photoUrl, bodyEntryId) {
  await supabase.from("body_photos").insert({
    user_id: userId,
    date,
    photo_url: photoUrl,
    body_entry_id: bodyEntryId || null,
  });
}

export async function uploadPhoto(userId, file) {
  const ext = file.name?.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("photos").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("photos").getPublicUrl(path);
  return data.publicUrl;
}

// ── CHALLENGES ──

export async function getChallenges(userId) {
  const { data: challengeRows } = await supabase
    .from("challenges")
    .select("*")
    .eq("user_id", userId);

  const challenges = [];
  for (const ch of (challengeRows || [])) {
    const { data: weeks } = await supabase
      .from("challenge_weeks")
      .select("*")
      .eq("challenge_id", ch.id)
      .order("week_number", { ascending: true });

    challenges.push({
      id: ch.id,
      name: ch.name,
      startDate: ch.start_date,
      weeks: (weeks || []).map(w => ({
        Mon: w.mon || "",
        Tue: w.tue || "",
        Wed: w.wed || "",
        Thu: w.thu || "",
        Fri: w.fri || "",
        Sat: w.sat || "",
        Sun: w.sun || "",
      })),
    });
  }
  return challenges;
}

export async function createChallenge(userId, name, weeks) {
  const { data: ch } = await supabase.from("challenges").insert({
    user_id: userId,
    name,
    is_active: false,
  }).select().single();

  for (let i = 0; i < weeks.length; i++) {
    await supabase.from("challenge_weeks").insert({
      challenge_id: ch.id,
      week_number: i + 1,
      mon: weeks[i].Mon || "",
      tue: weeks[i].Tue || "",
      wed: weeks[i].Wed || "",
      thu: weeks[i].Thu || "",
      fri: weeks[i].Fri || "",
      sat: weeks[i].Sat || "",
      sun: weeks[i].Sun || "",
    });
  }
  return ch;
}

export async function updateChallengeWeek(challengeId, weekNumber, schedule) {
  await supabase.from("challenge_weeks").upsert({
    challenge_id: challengeId,
    week_number: weekNumber,
    mon: schedule.Mon || "",
    tue: schedule.Tue || "",
    wed: schedule.Wed || "",
    thu: schedule.Thu || "",
    fri: schedule.Fri || "",
    sat: schedule.Sat || "",
    sun: schedule.Sun || "",
  }, { onConflict: "challenge_id,week_number" });
}

export async function startChallenge(challengeId, startDate) {
  const { data: ch } = await supabase.from("challenges").select("user_id").eq("id", challengeId).single();
  await supabase.from("challenges").update({ start_date: null, is_active: false }).eq("user_id", ch.user_id);
  await supabase.from("challenges").update({ start_date: startDate, is_active: true }).eq("id", challengeId);
}

export async function stopChallenge(challengeId) {
  await supabase.from("challenges").update({ start_date: null, is_active: false }).eq("id", challengeId);
}

export async function deleteChallenge(challengeId) {
  await supabase.from("challenges").delete().eq("id", challengeId);
}

export async function addChallengeWeek(challengeId, weekNumber) {
  await supabase.from("challenge_weeks").insert({
    challenge_id: challengeId,
    week_number: weekNumber,
    mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "",
  });
}

// ── RECURRING ACTIVITIES ──

export async function getRecurring(userId) {
  const { data } = await supabase
    .from("recurring_activities")
    .select("*")
    .eq("user_id", userId);
  const mapped = {};
  (data || []).forEach(r => { mapped[r.name] = r.days; });
  return mapped;
}

export async function addRecurring(userId, name, days) {
  await supabase.from("recurring_activities").insert({
    user_id: userId,
    name,
    days,
  });
}

export async function deleteRecurring(userId, name) {
  await supabase.from("recurring_activities").delete()
    .eq("user_id", userId)
    .eq("name", name);
}

// ── CHECKINS ──

export async function getCheckins(userId) {
  const { data } = await supabase
    .from("checkins")
    .select("*")
    .eq("user_id", userId);
  const mapped = {};
  (data || []).forEach(c => {
    mapped[c.date] = {
      mood: c.mood,
      energy: c.energy,
      sleep: c.sleep,
      wins: c.wins,
      notes: c.notes,
    };
  });
  return mapped;
}
