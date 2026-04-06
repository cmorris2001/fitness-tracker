import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Check your email to confirm your account!");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      }
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0c;
          font-family: 'DM Sans', sans-serif;
          padding: 20px;
        }
        .login-card {
          width: 100%;
          max-width: 380px;
          background: #141418;
          border: 1px solid #2a2a34;
          border-radius: 20px;
          padding: 40px 28px;
        }
        .login-title {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 800;
          background: linear-gradient(135deg, #6ee7b7, #7dd3fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-align: center;
          margin-bottom: 6px;
        }
        .login-subtitle {
          text-align: center;
          color: #626270;
          font-size: 13px;
          margin-bottom: 28px;
        }
        .login-input {
          width: 100%;
          padding: 12px 16px;
          background: #1c1c22;
          border: 1px solid #2a2a34;
          border-radius: 10px;
          color: #eeeef0;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          margin-bottom: 12px;
          box-sizing: border-box;
        }
        .login-input:focus { border-color: #6ee7b7; }
        .login-input::placeholder { color: #626270; }
        .login-btn {
          width: 100%;
          padding: 13px;
          background: #6ee7b7;
          color: #0a0a0c;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 4px;
        }
        .login-btn:hover { background: #34d399; }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .login-error {
          background: rgba(251,113,133,0.12);
          color: #fb7185;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 12px;
          text-align: center;
        }
        .login-success {
          background: rgba(110,231,183,0.1);
          color: #6ee7b7;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 12px;
          text-align: center;
        }
        .login-toggle {
          text-align: center;
          margin-top: 16px;
          color: #626270;
          font-size: 13px;
        }
        .login-toggle span {
          color: #6ee7b7;
          cursor: pointer;
          font-weight: 600;
        }
        .login-toggle span:hover { text-decoration: underline; }
      `}</style>
      <div className="login-page">
        <div className="login-card">
          <div className="login-title">FitTrack</div>
          <div className="login-subtitle">{isSignUp ? "Create your account" : "Welcome back"}</div>

          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          <input
            className="login-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          <button className="login-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </button>

          <div className="login-toggle">
            {isSignUp ? (
              <>Already have an account? <span onClick={() => { setIsSignUp(false); setError(""); setSuccess(""); }}>Sign in</span></>
            ) : (
              <>Don't have an account? <span onClick={() => { setIsSignUp(true); setError(""); setSuccess(""); }}>Sign up</span></>
            )}
          </div>
        </div>
      </div>
    </>
  );
}