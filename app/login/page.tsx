"use client";

import { useState, useEffect } from "react";
import { loginWithGoogle } from "@/lib/userAuth";

const handleGoogleLogin = async () => {
  try {
    await loginWithGoogle();
    window.location.href = "/dashboard";
  } catch (error) {
    console.log(error);
  }
};
// ─── Firebase stub types (replace with your actual firebase imports) ──────────
// import { loginWithEmail, signInWithGoogle } from "@/lib/firebase/auth";

async function loginWithEmail(email: string, password: string): Promise<void> {
  // Replace with: await signInWithEmailAndPassword(auth, email, password);
  throw new Error("Replace with your Firebase loginWithEmail implementation");
}

async function signInWithGoogle(): Promise<void> {
  // Replace with: await signInWithPopup(auth, googleProvider);
  throw new Error("Replace with your Firebase signInWithGoogle implementation");
}

// ─── Types ────────────────────────────────────────────────────────────────────
type View = "login" | "forgot";

interface FieldError {
  email?: string;
  password?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(email: string, password: string): FieldError {
  const errors: FieldError = {};
  if (!email) errors.email = "Email is required.";
  else if (!validateEmail(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  else if (password.length < 6) errors.password = "Password must be at least 6 characters.";
  return errors;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FloatingOrb({ className }: { className: string }) {
  return <div className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`} />;
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({ email: false, password: false });
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Live validation after first touch
  useEffect(() => {
    if (touched.email || touched.password) {
      setErrors(validateForm(email, password));
    }
  }, [email, password, touched]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const errs = validateForm(email, password);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setGlobalError("");
    setLoadingEmail(true);
    try {
      await loginWithEmail(email, password);
      // On success: redirect handled by Firebase / your auth guard
    } catch (err: unknown) {
      setGlobalError(friendlyError(err));
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGlobalError("");
    setLoadingGoogle(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setGlobalError(friendlyError(err));
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setErrors({ email: "Enter a valid email to reset your password." });
      return;
    }
    setErrors({});
    // Simulate sending reset email (wire up sendPasswordResetEmail here)
    setSuccessMessage("If that email exists, a reset link is on its way.");
  };

  function friendlyError(err: unknown): string {
    if (err instanceof Error) {
      const msg = err.message;
      if (msg.includes("user-not-found") || msg.includes("wrong-password")) return "Incorrect email or password.";
      if (msg.includes("too-many-requests")) return "Too many attempts. Please try again later.";
      if (msg.includes("popup-closed")) return "Sign-in popup was closed. Please try again.";
      return msg;
    }
    return "Something went wrong. Please try again.";
  }

  const isLoading = loadingEmail || loadingGoogle;

  return (
    <>
      {/* ── Global styles injected inline for portability ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0a0a0f;
          --surface: #12121a;
          --surface-2: #1a1a26;
          --border: rgba(255,255,255,0.08);
          --border-focus: rgba(139,92,246,0.6);
          --text: #f0f0f8;
          --text-muted: #7878a0;
          --accent: #8b5cf6;
          --accent-2: #06b6d4;
          --accent-glow: rgba(139,92,246,0.35);
          --error: #f87171;
          --success: #34d399;
          --radius: 14px;
        }

        body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }

        .syne { font-family: 'Syne', sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-18px) scale(1.04); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 var(--accent-glow); }
          70%  { box-shadow: 0 0 0 10px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }

        .fade-up { animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.12s; }
        .fade-up-3 { animation-delay: 0.19s; }
        .fade-up-4 { animation-delay: 0.26s; }
        .fade-up-5 { animation-delay: 0.33s; }

        .orb-1 { animation: float 8s ease-in-out infinite; }
        .orb-2 { animation: float 11s ease-in-out infinite 2s; }
        .orb-3 { animation: float 9s ease-in-out infinite 4s; }

        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          box-shadow: 0 0 0 1px var(--border), 0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(139,92,246,0.05);
          backdrop-filter: blur(20px);
        }

        .input-wrap { position: relative; }

        .input {
          width: 100%;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 14px 16px;
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input::placeholder { color: var(--text-muted); }
        .input:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.15);
        }
        .input.has-error { border-color: var(--error); }
        .input.has-error:focus { box-shadow: 0 0 0 3px rgba(248,113,113,0.15); }

        .btn-primary {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 20px;
          border-radius: var(--radius);
          border: none;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          background: linear-gradient(135deg, var(--accent) 0%, #6366f1 60%, var(--accent-2) 120%);
          color: #fff;
          box-shadow: 0 4px 20px rgba(139,92,246,0.4);
        }
        .btn-primary:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(139,92,246,0.5);
        }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 13px 20px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
        }
        .btn-google:hover:not(:disabled) {
          background: var(--surface);
          border-color: rgba(255,255,255,0.16);
          transform: translateY(-1px);
        }
        .btn-google:active:not(:disabled) { transform: translateY(0); }
        .btn-google:disabled { opacity: 0.5; cursor: not-allowed; }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-muted);
          font-size: 13px;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .error-msg { color: var(--error); font-size: 12.5px; margin-top: 5px; }
        .global-error {
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.25);
          border-radius: 10px;
          padding: 12px 14px;
          color: var(--error);
          font-size: 13.5px;
          text-align: center;
        }
        .success-msg {
          background: rgba(52,211,153,0.08);
          border: 1px solid rgba(52,211,153,0.25);
          border-radius: 10px;
          padding: 12px 14px;
          color: var(--success);
          font-size: 13.5px;
          text-align: center;
        }

        .logo-ring {
          width: 52px; height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 0 1px rgba(139,92,246,0.4), 0 8px 24px rgba(139,92,246,0.3);
        }

        .link-btn {
          background: none; border: none; cursor: pointer;
          color: var(--accent); font-family: 'DM Sans', sans-serif; font-size: 14px;
          transition: opacity 0.2s;
        }
        .link-btn:hover { opacity: 0.75; text-decoration: underline; }

        .eye-btn {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: var(--text-muted);
          display: flex; align-items: center;
          transition: color 0.2s;
        }
        .eye-btn:hover { color: var(--text); }
      `}</style>

      {/* ── Layout ── */}
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
        background: "var(--bg)",
      }}>
        {/* Ambient orbs */}
        <div className="orb-1" style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)", top: "-120px", left: "-100px", pointerEvents: "none" }} />
        <div className="orb-2" style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.13) 0%, transparent 70%)", bottom: "-80px", right: "-80px", pointerEvents: "none" }} />
        <div className="orb-3" style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", top: "50%", left: "60%", pointerEvents: "none" }} />

        {/* Card */}
        <div className="card" style={{ width: "100%", maxWidth: 420, padding: "40px 36px", opacity: mounted ? 1 : 0, transition: "opacity 0.3s" }}>

          {view === "login" ? (
            <LoginView
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              showPassword={showPassword} setShowPassword={setShowPassword}
              errors={errors} touched={touched} setTouched={setTouched}
              globalError={globalError}
              loadingEmail={loadingEmail} loadingGoogle={loadingGoogle} isLoading={isLoading}
              onSubmit={handleEmailLogin}
              onGoogle={handleGoogleLogin}
              onForgot={() => { setView("forgot"); setErrors({}); setGlobalError(""); setSuccessMessage(""); }}
            />
          ) : (
            <ForgotView
              email={email} setEmail={setEmail}
              errors={errors} setErrors={setErrors}
              successMessage={successMessage}
              onSubmit={handleForgotPassword}
              onBack={() => { setView("login"); setErrors({}); setGlobalError(""); setSuccessMessage(""); }}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ─── Login View ───────────────────────────────────────────────────────────────
function LoginView({
  email, setEmail, password, setPassword, showPassword, setShowPassword,
  errors, touched, setTouched, globalError,
  loadingEmail, loadingGoogle, isLoading,
  onSubmit, onGoogle, onForgot,
}: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  showPassword: boolean; setShowPassword: (v: boolean) => void;
  errors: FieldError; touched: { email: boolean; password: boolean };
  setTouched: (v: { email: boolean; password: boolean }) => void;
  globalError: string;
  loadingEmail: boolean; loadingGoogle: boolean; isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onGoogle: () => void;
  onForgot: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="fade-up fade-up-1" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
        <div className="logo-ring">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" fill="white" />
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="white" fillOpacity="0.5" />
            <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="white" fillOpacity="0.8" />
          </svg>
        </div>
        <div>
          <h1 className="syne" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4, color: "var(--text)" }}>
            Welcome to VibeCircle
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.5 }}>
            Sign in to your circle and keep the vibe going.
          </p>
        </div>
      </div>

      {/* Google */}
      <div className="fade-up fade-up-2">
        <button className="btn-google" onClick={onGoogle} disabled={isLoading} type="button">
          {loadingGoogle ? <Spinner /> : <GoogleIcon />}
          {loadingGoogle ? "Signing in…" : "Continue with Google"}
        </button>
      </div>

      {/* Divider */}
      <div className="divider fade-up fade-up-2">or sign in with email</div>

      {/* Global error */}
      {globalError && (
        <div className="global-error fade-up fade-up-1">{globalError}</div>
      )}

      {/* Form */}
      <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Email */}
        <div className="fade-up fade-up-3">
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-muted)", marginBottom: 7, letterSpacing: "0.03em" }}>
            EMAIL ADDRESS
          </label>
          <input
            className={`input${errors.email && touched.email ? " has-error" : ""}`}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => {}}
            
            disabled={isLoading}
          />
          {errors.email && touched.email && <p className="error-msg">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="fade-up fade-up-4">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", letterSpacing: "0.03em" }}>
              PASSWORD
            </label>
            <button type="button" className="link-btn" style={{ fontSize: 13 }} onClick={onForgot}>
              Forgot password?
            </button>
          </div>
          <div className="input-wrap">
            <input
              className={`input${errors.password && touched.password ? " has-error" : ""}`}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              style={{ paddingRight: 46 }}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => {}}
              
              disabled={isLoading}
            />
            <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && touched.password && <p className="error-msg">{errors.password}</p>}
        </div>

        {/* Submit */}
        <div className="fade-up fade-up-5" style={{ marginTop: 4 }}>
          <button className="btn-primary" type="submit" disabled={isLoading}>
            {loadingEmail ? <><Spinner /> Signing in…</> : "Sign In"}
          </button>
        </div>
      </form>

      {/* Sign up */}
      <p className="fade-up fade-up-5" style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
        Don&apos;t have an account?{" "}
        <a href="/signup" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
          Create one
        </a>
      </p>
    </div>
  );
}

// ─── Forgot Password View ─────────────────────────────────────────────────────
function ForgotView({
  email, setEmail, errors, setErrors, successMessage, onSubmit, onBack,
}: {
  email: string; setEmail: (v: string) => void;
  errors: FieldError; setErrors: (v: FieldError) => void;
  successMessage: string;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="fade-up fade-up-1" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: "var(--surface-2)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>
        <h1 className="syne" style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
          Reset your password
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {successMessage ? (
        <div className="success-msg fade-up fade-up-2">{successMessage}</div>
      ) : (
        <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="fade-up fade-up-2">
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-muted)", marginBottom: 7, letterSpacing: "0.03em" }}>
              EMAIL ADDRESS
            </label>
            <input
              className={`input${errors.email ? " has-error" : ""}`}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors({}); }}
            />
            {errors.email && <p className="error-msg">{errors.email}</p>}
          </div>
          <div className="fade-up fade-up-3">
            <button className="btn-primary" type="submit">
              Send Reset Link
            </button>
          </div>
        </form>
      )}

      <div className="fade-up fade-up-4" style={{ textAlign: "center" }}>
        <button type="button" className="link-btn" onClick={onBack}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to sign in
        </button>
      </div>
    </div>
  );
}
<button onClick={handleGoogleLogin}>
  Continue with Google
</button>