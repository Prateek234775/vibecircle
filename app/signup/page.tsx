"use client";
"use client";


import { useState, useEffect } from "react";
// ─── Firebase stubs (replace with your actual imports) ────────────────────────
// import { signupWithEmail, signInWithGoogle } from "@/lib/firebase/auth";
import {
  doc,
  setDoc,
} from "firebase/firestore";


import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";



import { auth, db } from "@/firebase/config";

async function signupWithEmail(
  name: string,
  email: string,
  password: string
): Promise<void> {

  // Create user
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  // Save display name
  await updateProfile(user, {
    displayName: name,
  });

  // Save data in Firestore
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name: name,
    email: email,
    createdAt: new Date(),
  });
}

async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();

  await signInWithPopup(auth, provider);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  terms?: string;
}

interface Touched {
  name: boolean;
  email: boolean;
  password: boolean;
  terms: boolean;
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(
  name: string,
  email: string,
  password: string,
  terms: boolean
): FieldErrors {
  const e: FieldErrors = {};
  if (!name.trim()) e.name = "Full name is required.";
  else if (name.trim().length < 2) e.name = "Name must be at least 2 characters.";
  if (!email) e.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address.";
  if (!password) e.password = "Password is required.";
  else if (password.length < 8) e.password = "Password must be at least 8 characters.";
  else if (!/[A-Z]/.test(password)) e.password = "Include at least one uppercase letter.";
  else if (!/[0-9]/.test(password)) e.password = "Include at least one number.";
  if (!terms) e.terms = "You must accept the terms to continue.";
  return e;
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "#f87171" };
  if (score <= 3) return { score, label: "Fair", color: "#fb923c" };
  if (score === 4) return { score, label: "Good", color: "#a3e635" };
  return { score, label: "Strong", color: "#34d399" };
}

function friendlyError(err: unknown): string {
  if (err instanceof Error) {
    const m = err.message;
    if (m.includes("email-already-in-use")) return "An account with this email already exists.";
    if (m.includes("invalid-email")) return "That email address isn't valid.";
    if (m.includes("weak-password")) return "Please choose a stronger password.";
    if (m.includes("popup-closed")) return "Sign-in popup was closed. Please try again.";
    if (m.includes("network-request-failed")) return "Network error. Check your connection.";
    return m;
  }
  return "Something went wrong. Please try again.";
}

// ─── Small reusable pieces ────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="vc-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Touched>({ name: false, email: false, password: false, terms: false });
  const [globalError, setGlobalError] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isLoading = loadingEmail || loadingGoogle;
  const strength = password ? passwordStrength(password) : null;

  useEffect(() => { setMounted(true); }, []);

  // Live-validate once a field has been touched
  useEffect(() => {
    if (Object.values(touched).some(Boolean)) {
      setErrors(validate(name, email, password, terms));
    }
  }, [name, email, password, terms, touched]);

  const touch = (field: keyof Touched) =>
    setTouched(prev => ({ ...prev, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, terms: true });
    const errs = validate(name, email, password, terms);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setGlobalError("");
    setLoadingEmail(true);
    try {
      await signupWithEmail(name.trim(), email, password);
      window.location.href = "/dashboard";;
    } catch (err) {
      setGlobalError(friendlyError(err));
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleGoogle = async () => {
    setGlobalError("");
    setLoadingGoogle(true);
    try {
      await signInWithGoogle();
      window.location.href = "/dashboard";;
    } catch (err) {
      setGlobalError(friendlyError(err));
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #080810;
          --surface: #0f0f1a;
          --surface-2: #161624;
          --surface-3: #1e1e2e;
          --border: rgba(255,255,255,0.07);
          --border-subtle: rgba(255,255,255,0.04);
          --border-focus: rgba(139,92,246,0.55);
          --text: #ededf5;
          --text-2: #a0a0c0;
          --text-3: #606080;
          --accent: #8b5cf6;
          --accent-light: #a78bfa;
          --accent-2: #06b6d4;
          --accent-glow: rgba(139,92,246,0.3);
          --error: #f87171;
          --success: #34d399;
          --warn: #fb923c;
          --radius-sm: 10px;
          --radius: 14px;
          --radius-lg: 20px;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .syne { font-family: 'Syne', sans-serif; }

        /* ── Animations ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatA {
          0%,100% { transform: translate(0,0) scale(1); }
          33%     { transform: translate(12px,-20px) scale(1.05); }
          66%     { transform: translate(-8px,10px) scale(0.97); }
        }
        @keyframes floatB {
          0%,100% { transform: translate(0,0) scale(1); }
          40%     { transform: translate(-15px,18px) scale(1.03); }
          70%     { transform: translate(10px,-12px) scale(0.98); }
        }
        @keyframes floatC {
          0%,100% { transform: translate(0,0); }
          50%     { transform: translate(8px,-14px); }
        }
        @keyframes vcSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes successPop {
          0%  { opacity: 0; transform: scale(0.85) translateY(12px); }
          60% { transform: scale(1.03) translateY(-2px); }
          100%{ opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes drawCheck {
          from { stroke-dashoffset: 60; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes gridScroll {
          from { background-position: 0 0; }
          to   { background-position: 40px 40px; }
        }

        .vc-spin { animation: vcSpin 0.75s linear infinite; }

        .fu  { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .fu1 { animation-delay: 0.04s; }
        .fu2 { animation-delay: 0.10s; }
        .fu3 { animation-delay: 0.16s; }
        .fu4 { animation-delay: 0.22s; }
        .fu5 { animation-delay: 0.28s; }
        .fu6 { animation-delay: 0.34s; }
        .fu7 { animation-delay: 0.40s; }
        .fu8 { animation-delay: 0.46s; }

        /* ── Background ── */
        .vc-bg {
          position: fixed; inset: 0; overflow: hidden; z-index: 0;
          background: var(--bg);
        }
        .vc-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: gridScroll 8s linear infinite;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%);
        }
        .orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none;
        }
        .orb-a {
          width: 560px; height: 560px;
          background: radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 65%);
          top: -180px; left: -120px;
          animation: floatA 12s ease-in-out infinite;
        }
        .orb-b {
          width: 480px; height: 480px;
          background: radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 65%);
          bottom: -140px; right: -100px;
          animation: floatB 15s ease-in-out infinite;
        }
        .orb-c {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%);
          top: 45%; left: 55%;
          animation: floatC 9s ease-in-out infinite;
        }

        /* ── Card ── */
        .vc-card {
          position: relative; z-index: 1;
          width: 100%; max-width: 440px;
          background: linear-gradient(160deg, rgba(22,22,36,0.95) 0%, rgba(15,15,26,0.98) 100%);
          border: 1px solid var(--border);
          border-radius: 26px;
          box-shadow:
            0 0 0 1px var(--border-subtle),
            0 40px 100px rgba(0,0,0,0.7),
            0 0 80px rgba(139,92,246,0.06),
            inset 0 1px 0 rgba(255,255,255,0.05);
          padding: 40px 36px 36px;
          backdrop-filter: blur(24px);
        }

        /* ── Logo ── */
        .vc-logo {
          width: 54px; height: 54px; border-radius: 17px;
          background: linear-gradient(145deg, #8b5cf6 0%, #6366f1 50%, #06b6d4 120%);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 0 1px rgba(139,92,246,0.5), 0 10px 28px rgba(139,92,246,0.35);
        }

        /* ── Inputs ── */
        .vc-label {
          display: block;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--text-3);
          margin-bottom: 7px;
          text-transform: uppercase;
        }
        .vc-input-wrap { position: relative; }
        .vc-input {
          width: 100%;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 13px 16px;
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 14.5px;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .vc-input::placeholder { color: var(--text-3); }
        .vc-input:focus {
          background: var(--surface-3);
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
        }
        .vc-input:hover:not(:focus):not(:disabled) {
          border-color: rgba(255,255,255,0.12);
        }
        .vc-input.err { border-color: rgba(248,113,113,0.5); }
        .vc-input.err:focus { box-shadow: 0 0 0 3px rgba(248,113,113,0.1); }
        .vc-input:disabled { opacity: 0.45; cursor: not-allowed; }

        .vc-input-icon {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: var(--text-3); display: flex; align-items: center;
          transition: color 0.15s;
          padding: 2px;
        }
        .vc-input-icon:hover { color: var(--text-2); }

        /* ── Password strength ── */
        .strength-bars {
          display: flex; gap: 4px; margin-top: 8px;
        }
        .strength-bar {
          flex: 1; height: 3px; border-radius: 99px;
          background: var(--surface-3);
          transition: background 0.3s;
        }

        /* ── Checkbox ── */
        .vc-checkbox-row {
          display: flex; align-items: flex-start; gap: 11px; cursor: pointer;
          user-select: none;
        }
        .vc-checkbox {
          flex-shrink: 0;
          width: 19px; height: 19px; border-radius: 6px;
          border: 1.5px solid var(--border);
          background: var(--surface-2);
          display: flex; align-items: center; justify-content: center;
          margin-top: 1px;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
        }
        .vc-checkbox.checked {
          background: var(--accent);
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.18);
        }
        .vc-checkbox.err-check { border-color: rgba(248,113,113,0.6); }

        /* ── Buttons ── */
        .vc-btn-primary {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 20px;
          border-radius: var(--radius);
          border: none;
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700; letter-spacing: 0.02em;
          color: #fff; cursor: pointer;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 55%, #06b6d4 130%);
          box-shadow: 0 4px 22px rgba(139,92,246,0.42);
          transition: opacity 0.18s, transform 0.14s, box-shadow 0.18s;
          position: relative; overflow: hidden;
        }
        .vc-btn-primary::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
          pointer-events: none;
        }
        .vc-btn-primary:hover:not(:disabled) {
          opacity: 0.91; transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(139,92,246,0.52);
        }
        .vc-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .vc-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

        .vc-btn-google {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 13px 20px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 14.5px; font-weight: 500;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s, transform 0.14s;
        }
        .vc-btn-google:hover:not(:disabled) {
          background: var(--surface-3);
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-1px);
        }
        .vc-btn-google:active:not(:disabled) { transform: translateY(0); }
        .vc-btn-google:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Divider ── */
        .vc-divider {
          display: flex; align-items: center; gap: 12px;
          color: var(--text-3); font-size: 12.5px;
        }
        .vc-divider::before, .vc-divider::after {
          content: ''; flex: 1; height: 1px;
          background: linear-gradient(90deg, transparent, var(--border), transparent);
        }

        /* ── Alerts ── */
        .vc-error-global {
          background: rgba(248,113,113,0.07);
          border: 1px solid rgba(248,113,113,0.22);
          border-radius: var(--radius-sm);
          padding: 11px 14px;
          color: var(--error); font-size: 13px;
          display: flex; align-items: flex-start; gap: 8px;
        }
        .vc-field-error {
          font-size: 12px; color: var(--error);
          margin-top: 5px; display: flex; align-items: center; gap: 5px;
        }

        /* ── Success screen ── */
        .vc-success {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 20px;
          animation: successPop 0.55s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .vc-success-icon {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.08));
          border: 1.5px solid rgba(52,211,153,0.3);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 40px rgba(52,211,153,0.15);
        }
        .vc-check-path {
          stroke-dasharray: 60; stroke-dashoffset: 60;
          animation: drawCheck 0.5s 0.2s cubic-bezier(0.22,1,0.36,1) forwards;
        }

        /* ── Misc ── */
        .vc-link {
          color: var(--accent-light); text-decoration: none;
          transition: color 0.15s;
        }
        .vc-link:hover { color: #fff; }

        .vc-features {
          display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;
          margin-top: 4px;
        }
        .vc-feature-pill {
          font-size: 11px; padding: 3px 9px; border-radius: 99px;
          background: rgba(139,92,246,0.1);
          border: 1px solid rgba(139,92,246,0.2);
          color: var(--accent-light);
        }

        @media (max-width: 480px) {
          .vc-card { padding: 32px 22px 28px; border-radius: 20px; }
        }
      `}</style>

      {/* ── Background ── */}
      <div className="vc-bg">
        <div className="vc-grid" />
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
      </div>

      {/* ── Page shell ── */}
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 16px",
        position: "relative",
        zIndex: 1,
      }}>
        <div
          className="vc-card"
          style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.25s" }}
        >
          {success ? (
            <SuccessScreen name={name} />
          ) : (
            <SignupForm
              name={name} setName={setName}
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              showPassword={showPassword} setShowPassword={setShowPassword}
              terms={terms} setTerms={setTerms}
              errors={errors} touched={touched}
              strength={strength}
              globalError={globalError}
              loadingEmail={loadingEmail} loadingGoogle={loadingGoogle}
              isLoading={isLoading}
              touch={touch}
              onSubmit={handleSubmit}
              onGoogle={handleGoogle}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ─── Signup Form ──────────────────────────────────────────────────────────────
function SignupForm({
  name, setName, email, setEmail, password, setPassword,
  showPassword, setShowPassword, terms, setTerms,
  errors, touched, strength, globalError,
  loadingEmail, loadingGoogle, isLoading,
  touch, onSubmit, onGoogle,
}: {
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  showPassword: boolean; setShowPassword: (v: boolean) => void;
  terms: boolean; setTerms: (v: boolean) => void;
  errors: FieldErrors; touched: Touched;
  strength: { score: number; label: string; color: string } | null;
  globalError: string;
  loadingEmail: boolean; loadingGoogle: boolean; isLoading: boolean;
  touch: (f: keyof Touched) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogle: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* Header */}
      <div className="fu fu1" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div className="vc-logo">
          <svg width="27" height="27" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="2.8" fill="white" />
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="white" fillOpacity="0.45" />
            <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="white" fillOpacity="0.75" />
          </svg>
        </div>
        <div>
          <h1 className="syne" style={{ fontSize: 25, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: 6 }}>
            Join VibeCircle
          </h1>
          <p className="px-5">
            Create your account and find your circle.
          </p>
          <div className="vc-features" style={{ marginTop: 10 }}>
            {["Discover vibes", "Real connections", "Your space"].map(f => (
              <span key={f} className="vc-feature-pill">{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Google */}
      <div className="fu fu2">
        <button
          type="button"
          className="vc-btn-google"
          onClick={onGoogle}
          disabled={isLoading}
        >
          {loadingGoogle ? <Spinner /> : <GoogleIcon />}
          {loadingGoogle ? "Connecting…" : "Continue with Google"}
        </button>
      </div>

      {/* Divider */}
      <div className="vc-divider fu fu2">or sign up with email</div>

      {/* Global error */}
      {globalError && (
        <div className="vc-error-global fu fu1">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {globalError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Full name */}
        <div className="fu fu3">
          <label className="vc-label">Full Name</label>
          <input
            className={`vc-input${touched.name && errors.name ? " err" : ""}`}
            type="text"
            autoComplete="name"
            placeholder="Alex Rivera"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => touch("name")}
            disabled={isLoading}
          />
          {touched.name && errors.name && (
            <p className="vc-field-error">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="fu fu4">
          <label className="vc-label">Email Address</label>
          <input
            className={`vc-input${touched.email && errors.email ? " err" : ""}`}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => touch("email")}
            disabled={isLoading}
          />
          {touched.email && errors.email && (
            <p className="vc-field-error">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="fu fu5">
          <label className="vc-label">Password</label>
          <div className="vc-input-wrap">
            <input
              className={`vc-input${touched.password && errors.password ? " err" : ""}`}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              style={{ paddingRight: 44 }}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => touch("password")}
              disabled={isLoading}
            />
            <button
              type="button"
              className="vc-input-icon"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>

          {/* Strength meter */}
          {password && strength && (
            <div style={{ marginTop: 8 }}>
              <div className="strength-bars">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className="strength-bar"
                    style={{ background: i <= strength.score ? strength.color : undefined, opacity: i <= strength.score ? 1 : 0.2 }}
                  />
                ))}
              </div>
              <p style={{ fontSize: 11.5, color: strength.color, marginTop: 5, fontWeight: 500 }}>
                {strength.label} password
              </p>
            </div>
          )}

          {touched.password && errors.password && (
            <p className="vc-field-error">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {errors.password}
            </p>
          )}
        </div>

        {/* Terms */}
        <div className="fu fu6">
          <label
            className="vc-checkbox-row"
            onClick={() => { setTerms(!terms); touch("terms"); }}
          >
            <div className={`vc-checkbox${terms ? " checked" : ""}${touched.terms && errors.terms ? " err-check" : ""}`}>
              {terms && <CheckIcon />}
            </div>
            <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55, paddingTop: 1 }}>
              I agree to the{" "}
              <a href="/terms" className="vc-link" onClick={e => e.stopPropagation()}>Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" className="vc-link" onClick={e => e.stopPropagation()}>Privacy Policy</a>
            </span>
          </label>
          {touched.terms && errors.terms && (
            <p className="vc-field-error" style={{ marginTop: 6, marginLeft: 30 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {errors.terms}
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="fu fu7" style={{ marginTop: 2 }}>
          <button className="vc-btn-primary" type="submit" disabled={isLoading}>
            {loadingEmail ? <><Spinner /> Creating account…</> : "Create Account"}
          </button>
        </div>
      </form>

      {/* Sign in link */}
      <p className="fu fu8" style={{ textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>
        Already have an account?{" "}
        <a href="/login" className="vc-link" style={{ fontWeight: 500 }}>Sign in</a>
      </p>
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ name }: { name: string }) {
  const firstName = name.trim().split(" ")[0] || "there";
  return (
    <div className="vc-success" style={{ padding: "16px 0 8px" }}>
      <div className="vc-success-icon">
        <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
          <path
            className="vc-check-path"
            d="M13 25l8 8 16-16"
            stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <h2 className="syne" style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>
          Welcome, {firstName}! 🎉
        </h2>
        <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.6, maxWidth: 300, margin: "0 auto" }}>
          Your VibeCircle account is ready. Head to your dashboard to start exploring.
        </p>
      </div>
      <a
        href="/dashboard"
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "13px 28px", borderRadius: 14,
          background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
          color: "#fff", textDecoration: "none",
          fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15,
          boxShadow: "0 6px 24px rgba(139,92,246,0.4)",
          transition: "opacity 0.2s, transform 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
      >
        Go to Dashboard
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </a>
      <p style={{ fontSize: 12, color: "var(--text-3)" }}>
        Check your inbox for a verification email.
      </p>
    </div>
  );
}