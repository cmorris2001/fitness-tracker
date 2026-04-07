import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Icons } from "../lib/shared";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (authError) setError(authError.message);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: 24,
      background: "var(--bg, #0a0a0c)", color: "var(--text, #eeeef0)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 36, fontWeight: 800,
          background: "linear-gradient(135deg, #6ee7b7, #7dd3fc)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Fitness Tracker
        </h1>
        <p style={{ color: "#626270", fontSize: 14, marginTop: 8 }}>
          Track meals, workouts, steps & body
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{
        width: "100%", maxWidth: 360,
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: "12px 16px", background: "#1c1c22", border: "1px solid #2a2a34",
            borderRadius: 10, color: "#eeeef0", fontSize: 14,
            fontFamily: "'DM Sans', sans-serif", outline: "none",
          }}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            padding: "12px 16px", background: "#1c1c22", border: "1px solid #2a2a34",
            borderRadius: 10, color: "#eeeef0", fontSize: 14,
            fontFamily: "'DM Sans', sans-serif", outline: "none",
          }}
        />

        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 10,
            background: "rgba(251,113,133,0.12)", color: "#fb7185",
            fontSize: 13, fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          padding: "12px 24px", borderRadius: 10, border: "none",
          background: "#6ee7b7", color: "#0a0a0c",
          fontSize: 14, fontWeight: 700, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          opacity: loading ? 0.6 : 1, transition: "all 0.2s",
        }}>
          {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
        </button>

        <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(null); }} style={{
          background: "none", border: "none", color: "#9898a4",
          fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          padding: 8,
        }}>
          {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </button>
      </form>
    </div>
  );
}
