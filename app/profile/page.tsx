"use client";


import {
  auth,
  db,
} from "@/firebase/config";

import {
  getUserProfile,
  saveUserProfile,
} from "@/lib/firestore";

import React from "react";

import { useState, useEffect, useRef } from "react";

import { onAuthStateChanged } from "firebase/auth";


// ─── Types ────────────────────────────────────────────────────────────────────
interface UserProfile {
  name: string;
  profession: string;
  hobbies: string;
  city: string;
  bio: string;
  photoURL: string;
}

interface FieldErrors {
  name?: string;
  profession?: string;
  city?: string;
  bio?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_BIO = 280;

const HOBBY_SUGGESTIONS = [
  "Photography", "Hiking", "Cooking", "Gaming", "Reading",
  "Traveling", "Music", "Painting", "Yoga", "Cycling",
  "Film", "Writing", "Coffee", "Dancing", "Design",
];

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(profile: UserProfile): FieldErrors {
  const e: FieldErrors = {};
  if (!profile.name.trim()) e.name = "Name is required.";
  else if (profile.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
  if (!profile.profession.trim()) e.profession = "Profession is required.";
  if (!profile.city.trim()) e.city = "City is required.";
  if (profile.bio.length > MAX_BIO) e.bio = `Bio must be under ${MAX_BIO} characters.`;
  return e;
}

// ─── Small UI pieces ──────────────────────────────────────────────────────────
function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ animation: "vcSpin 0.75s linear infinite", flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p style={{ fontSize: 12, color: "var(--error)", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {msg}
    </p>
  );
}

// Field wrapper keeps label + input + error together
function Field({ label, icon, error, hint, children }: {
  label: string;
  icon: React.ReactNode;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <label style={{
        fontSize: 11.5, fontWeight: 600, letterSpacing: "0.07em",
        textTransform: "uppercase", color: "var(--text-3)", marginBottom: 7,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{ color: "var(--accent)", opacity: 0.8 }}>{icon}</span>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 5 }}>{hint}</p>
      )}
      <FieldError msg={error} />
    </div>
  );
}

// ─── Avatar initials component ────────────────────────────────────────────────
function Avatar({ name, size = 88 }: { name: string; size?: number }) {
  const initials = name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("") || "?";

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #06b6d4 120%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.32, fontWeight: 700, color: "#fff",
      fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em",
      boxShadow: "0 0 0 3px rgba(139,92,246,0.25), 0 8px 24px rgba(139,92,246,0.3)",
      flexShrink: 0, userSelect: "none",
    }}>
      {initials}
    </div>
  );
}

// ─── Hobby tag ────────────────────────────────────────────────────────────────
function HobbyTag({ label, onRemove, disabled }: { label: string; onRemove: () => void; disabled: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 10px 5px 12px", borderRadius: 99,
      background: "rgba(139,92,246,0.12)",
      border: "1px solid rgba(139,92,246,0.25)",
      color: "#a78bfa", fontSize: 13, fontWeight: 500,
    }}>
      {label}
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "inherit", opacity: 0.6, padding: 0, lineHeight: 1,
            display: "flex", alignItems: "center", transition: "opacity 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [uid, setUid] = useState("");

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      setUid(user.uid);
      const existingProfile =
        await getUserProfile(user.uid);

      if (existingProfile) {
       setProfile({
          name:
           existingProfile.name || "",
           profession:
            existingProfile.profession || "",
          hobbies:
            existingProfile.hobbies || "",
          city:
            existingProfile.city || "",
          bio:
            existingProfile.bio || "",
          photoURL:
            existingProfile.photoURL || "",
          });
      }
    }
  });

  return () => unsubscribe();
}, []); // replace with real uid

  const [profile, setProfile] =
  useState<UserProfile>({
    name: "",
    profession: "",
    hobbies: "",
    city: "",
    bio: "",
    photoURL: "",
  });

  // Hobby tags derived from the hobbies string
  const [hobbyInput, setHobbyInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const hobbyInputRef = useRef<HTMLInputElement>(null);

  const hobbyList: string[] = profile.hobbies
    ? profile.hobbies.split(",").map(h => h.trim()).filter(Boolean)
    : [];

  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Live validation once touched
  useEffect(() => {
    if (Object.values(touched).some(Boolean)) {
      setErrors(validate(profile));
    }
  }, [profile, touched]);

  // Helpers
  const set = (field: keyof UserProfile) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setProfile(prev => ({ ...prev, [field]: e.target.value }));
    setSaveStatus("idle");
  };

  const touch = (field: string) =>
    setTouched(prev => ({ ...prev, [field]: true }));

  const addHobby = (hobby: string) => {
    const trimmed = hobby.trim();
    if (!trimmed || hobbyList.includes(trimmed) || hobbyList.length >= 8) return;
    const next = [...hobbyList, trimmed].join(", ");
    setProfile(prev => ({ ...prev, hobbies: next }));
    setHobbyInput("");
    setSaveStatus("idle");
  };

  const removeHobby = (hobby: string) => {
    const next = hobbyList.filter(h => h !== hobby).join(", ");
    setProfile(prev => ({ ...prev, hobbies: next }));
    setSaveStatus("idle");
  };

  const handleHobbyKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addHobby(hobbyInput);
    }
    if (e.key === "Backspace" && hobbyInput === "" && hobbyList.length > 0) {
      removeHobby(hobbyList[hobbyList.length - 1]);
    }
  };

  const filteredSuggestions = HOBBY_SUGGESTIONS.filter(
    s => !hobbyList.includes(s) && s.toLowerCase().includes(hobbyInput.toLowerCase())
  );

  const handleSave = async (
  e: React.FormEvent
) => {
  e.preventDefault();

  const allTouched = Object.fromEntries(
    ["name", "profession", "city", "bio"].map(
      (k) => [k, true]
    )
  );

  setTouched(allTouched);

  const errs = validate(profile);

  setErrors(errs);

  if (Object.keys(errs).length > 0)
    return;

  if (!uid) {
    alert("Please login first");
    return;
  }

  setSaving(true);

  setSaveStatus("idle");

  setErrorMessage("");

  try {
    await saveUserProfile(
      uid,
      profile
    );

    setSaveStatus("success");

    setTimeout(() => {
      setSaveStatus("idle");
    }, 3000);

  } catch (err) {

    setSaveStatus("error");

    setErrorMessage(
      err instanceof Error
        ? err.message
        : "Could not save profile."
    );

  } finally {

    setSaving(false);
  }
};

  const bioRemaining = MAX_BIO - profile.bio.length;
  const isComplete = profile.name && profile.profession && profile.city;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #080810;
          --surface:   #0e0e1c;
          --surface-2: #151525;
          --surface-3: #1c1c2e;
          --border:    rgba(255,255,255,0.07);
          --border-hi: rgba(255,255,255,0.12);
          --focus:     rgba(139,92,246,0.55);
          --text:      #eeeef8;
          --text-2:    #9898b8;
          --text-3:    #55556e;
          --accent:    #8b5cf6;
          --accent-2:  #06b6d4;
          --error:     #f87171;
          --success:   #34d399;
          --warn:      #fbbf24;
          --radius:    13px;
        }

        body {
          background: var(--bg); color: var(--text);
          font-family: 'DM Sans', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .syne { font-family: 'Syne', sans-serif; }

        @keyframes vcSpin  { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes floatA  { 0%,100%{transform:translate(0,0);} 50%{transform:translate(10px,-18px);} }
        @keyframes floatB  { 0%,100%{transform:translate(0,0);} 50%{transform:translate(-12px,14px);} }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes successSlide {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes checkPop {
          0%  { transform: scale(0); }
          60% { transform: scale(1.25); }
          100%{ transform: scale(1); }
        }
        @keyframes progressFill {
          from { width: 0; }
        }

        .fu  { animation: fadeUp 0.48s cubic-bezier(0.22,1,0.36,1) both; }
        .fu1 { animation-delay:0.04s; }
        .fu2 { animation-delay:0.10s; }
        .fu3 { animation-delay:0.16s; }
        .fu4 { animation-delay:0.22s; }
        .fu5 { animation-delay:0.28s; }
        .fu6 { animation-delay:0.34s; }
        .fu7 { animation-delay:0.40s; }

        /* ── Grid bg ── */
        .vc-grid {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
          background-size: 36px 36px;
          mask-image: radial-gradient(ellipse 90% 70% at 50% 30%, black 20%, transparent 100%);
        }
        .orb {
          position: fixed; border-radius: 50%;
          filter: blur(90px); pointer-events: none; z-index: 0;
        }
        .orb-a {
          width:500px; height:500px; top:-160px; left:-100px;
          background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%);
          animation: floatA 13s ease-in-out infinite;
        }
        .orb-b {
          width:420px; height:420px; bottom:-100px; right:-80px;
          background: radial-gradient(circle, rgba(6,182,212,0.13) 0%, transparent 65%);
          animation: floatB 16s ease-in-out infinite;
        }

        /* ── Layout ── */
        .vc-shell {
          position: relative; z-index: 1;
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center;
          padding: 40px 16px 60px;
        }

        /* ── Header bar ── */
        .vc-topbar {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; max-width: 760px; margin-bottom: 36px;
        }
        .vc-logo-mark {
          display: flex; align-items: center; gap: 10px;
        }
        .vc-logo-dot {
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 14px rgba(139,92,246,0.35);
        }
        .vc-breadcrumb {
          font-size: 12.5px; color: var(--text-3);
          display: flex; align-items: center; gap: 6px;
        }
        .vc-breadcrumb a {
          color: var(--text-3); text-decoration: none;
          transition: color 0.15s;
        }
        .vc-breadcrumb a:hover { color: var(--text-2); }

        /* ── Main grid ── */
        .vc-grid-layout {
          width: 100%; max-width: 760px;
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 20px;
          align-items: start;
        }

        /* ── Cards ── */
        .vc-card {
          background: linear-gradient(160deg, rgba(21,21,37,0.97) 0%, rgba(14,14,28,0.99) 100%);
          border: 1px solid var(--border);
          border-radius: 20px;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.025),
            0 24px 64px rgba(0,0,0,0.65),
            inset 0 1px 0 rgba(255,255,255,0.04);
          overflow: hidden;
        }
        .vc-card-pad { padding: 24px; }

        /* ── Sidebar card ── */
        .vc-sidebar {
          display: flex; flex-direction: column; gap: 0;
        }
        .vc-avatar-section {
          display: flex; flex-direction: column; align-items: center;
          padding: 28px 20px 22px; gap: 14px;
          border-bottom: 1px solid var(--border);
        }
        .vc-sidebar-meta {
          padding: 18px 20px; display: flex; flex-direction: column; gap: 14px;
        }
        .vc-meta-row {
          display: flex; align-items: flex-start; gap: 9px;
          font-size: 13px; color: var(--text-2); line-height: 1.45;
        }
        .vc-meta-icon { color: var(--text-3); margin-top: 1px; flex-shrink: 0; }

        /* ── Completion bar ── */
        .vc-completion {
          padding: 14px 20px 18px;
          border-top: 1px solid var(--border);
        }
        .vc-bar-track {
          height: 4px; background: var(--surface-3); border-radius: 99px;
          overflow: hidden; margin-top: 8px;
        }
        .vc-bar-fill {
          height: 100%; border-radius: 99px;
          background: linear-gradient(90deg, var(--accent), var(--accent-2));
          transition: width 0.5s cubic-bezier(0.34,1.56,0.64,1);
          animation: progressFill 0.6s 0.2s cubic-bezier(0.34,1.56,0.64,1) both;
        }

        /* ── Section header ── */
        .vc-section-header {
          padding: 22px 26px 18px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
        }

        /* ── Inputs ── */
        .vc-input {
          width: 100%;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 13px 15px;
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 14.5px;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .vc-input::placeholder { color: var(--text-3); }
        .vc-input:focus {
          border-color: var(--focus);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
          background: var(--surface-3);
        }
        .vc-input:hover:not(:focus):not(:disabled) { border-color: var(--border-hi); }
        .vc-input.err { border-color: rgba(248,113,113,0.45); }
        .vc-input.err:focus { box-shadow: 0 0 0 3px rgba(248,113,113,0.1); }
        .vc-input:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Hobby input box ── */
        .vc-hobby-box {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 8px 10px;
          display: flex; flex-wrap: wrap; gap: 7px; align-items: center;
          cursor: text;
          transition: border-color 0.18s, box-shadow 0.18s;
          min-height: 48px;
        }
        .vc-hobby-box:focus-within {
          border-color: var(--focus);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
        }
        .vc-hobby-input {
          background: none; border: none; outline: none;
          color: var(--text); font-family: 'DM Sans', sans-serif;
          font-size: 14px; min-width: 90px; flex: 1;
          padding: 4px 4px;
        }
        .vc-hobby-input::placeholder { color: var(--text-3); }

        /* ── Suggestions dropdown ── */
        .vc-suggestions {
          background: var(--surface-2);
          border: 1px solid var(--border-hi);
          border-radius: var(--radius);
          padding: 6px;
          display: flex; flex-wrap: wrap; gap: 5px;
          margin-top: 6px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .vc-suggestion-pill {
          padding: 5px 11px; border-radius: 99px; font-size: 12.5px;
          background: var(--surface-3); border: 1px solid var(--border);
          color: var(--text-2); cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .vc-suggestion-pill:hover {
          background: rgba(139,92,246,0.15);
          border-color: rgba(139,92,246,0.3);
          color: #a78bfa;
        }

        /* ── Textarea ── */
        .vc-textarea {
          width: 100%; resize: vertical; min-height: 110px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 13px 15px;
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 14.5px; line-height: 1.6;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .vc-textarea::placeholder { color: var(--text-3); }
        .vc-textarea:focus {
          border-color: var(--focus);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
          background: var(--surface-3);
        }
        .vc-textarea.err { border-color: rgba(248,113,113,0.45); }
        .vc-textarea:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Save button ── */
        .vc-btn-save {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 13px 28px; border-radius: var(--radius);
          border: none; cursor: pointer;
          font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
          letter-spacing: 0.02em; color: #fff;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 55%, #06b6d4 130%);
          box-shadow: 0 4px 20px rgba(139,92,246,0.4);
          transition: opacity 0.18s, transform 0.14s, box-shadow 0.18s;
          position: relative; overflow: hidden;
        }
        .vc-btn-save::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
          pointer-events: none;
        }
        .vc-btn-save:hover:not(:disabled) {
          opacity: 0.9; transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(139,92,246,0.5);
        }
        .vc-btn-save:active:not(:disabled) { transform: translateY(0); }
        .vc-btn-save:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── Status banners ── */
        .vc-banner {
          display: flex; align-items: center; gap: 9px;
          padding: 12px 16px; border-radius: var(--radius);
          font-size: 13.5px; font-weight: 500;
          animation: successSlide 0.3s ease both;
        }
        .vc-banner-check { animation: checkPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }

        /* ── Two-col form grid ── */
        .vc-form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }
        .vc-form-body { padding: 26px 26px 24px; display: flex; flex-direction: column; gap: 20px; }
        .vc-form-footer {
          padding: 16px 26px 22px;
          border-top: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          flex-wrap: wrap;
        }

        /* ── Responsive ── */
        @media (max-width: 680px) {
          .vc-grid-layout { grid-template-columns: 1fr; }
          .vc-form-grid   { grid-template-columns: 1fr; }
          .vc-topbar { margin-bottom: 24px; }
          .vc-card { border-radius: 16px; }
        }
      `}</style>

      {/* ── Background ── */}
      <div className="vc-grid" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />

      {/* ── Shell ── */}
      <div className="vc-shell" style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.25s" }}>

        {/* Top bar */}
        <div className="vc-topbar fu fu1">
          <div className="vc-logo-mark">
            <div className="vc-logo-dot">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="2.8" fill="white" />
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="white" fillOpacity="0.4" />
              </svg>
            </div>
            <span className="syne" style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>
              VibeCircle
            </span>
          </div>
          <nav className="vc-breadcrumb">
            <a href="/dashboard">Dashboard</a>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
            <span style={{ color: "var(--text-2)" }}>Edit Profile</span>
          </nav>
        </div>

        {/* Content grid */}
        <div className="vc-grid-layout">

          {/* ── Sidebar ── */}
          <div className="fu fu2">
            <div className="vc-card vc-sidebar">

              {/* Avatar + name preview */}
              <div className="vc-avatar-section">
                {profile.photoURL ? (
  <img
    src={profile.photoURL}
    alt="profile"
    style={{
      width: 88,
      height: 88,
      borderRadius: "50%",
      objectFit: "cover",
      border:
        "3px solid rgba(139,92,246,0.4)",
    }}
  />
          ) : (
                  <Avatar
                    name={
                      profile.name || "Your Name"
                    }
                  />
                )}
                <div style={{ textAlign: "center" }}>
                  <p className="syne" style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.015em", color: profile.name ? "var(--text)" : "var(--text-3)" }}>
                    {profile.name || "Your Name"}
                  </p>
                  {/* VERIFIED BADGE */}
                  {profile.name && (
                   <span
                    style={{
                     display: "inline-flex",
                     alignItems: "center",
                     gap: "5px",
                     marginTop: "6px",
                     padding: "4px 10px",
                     borderRadius: "999px",
                     background: "rgba(52,211,153,0.12)",
                     border: "1px solid rgba(52,211,153,0.25)",
                     color: "#34d399",
                     fontSize: "11px",
                     fontWeight: 600,
                     letterSpacing: "0.05em",
                     textTransform: "uppercase",
                    }}
                   >
                    ✔ Verified User
                   </span>
                  )}
                  {profile.profession && (
                    <p style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 3 }}>
                      {profile.profession}
                    </p>
                  )}
                </div>
              </div>

              {/* Meta preview */}
              <div className="vc-sidebar-meta">
                {profile.city && (
                  <div className="vc-meta-row">
                    <span className="vc-meta-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    {profile.city}
                  </div>
                )}
                {hobbyList.length > 0 && (
                  <div className="vc-meta-row" style={{ flexWrap: "wrap", gap: "5px" }}>
                    {hobbyList.slice(0, 3).map(h => (
                      <span key={h} style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 99,
                        background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
                        color: "#a78bfa",
                      }}>{h}</span>
                    ))}
                    {hobbyList.length > 3 && (
                      <span style={{ fontSize: 11, color: "var(--text-3)" }}>+{hobbyList.length - 3}</span>
                    )}
                  </div>
                )}
                {profile.bio && (
                  <div className="vc-meta-row" style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-3)" }}>
                    <span className="vc-meta-icon">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                    <span style={{ WebkitLineClamp: 3, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {profile.bio}
                    </span>
                  </div>
                )}
              </div>

              {/* Completion bar */}
              <div className="vc-completion">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Profile Completion
                  </p>
                  <p style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
                    {completionPercent(profile)}%
                  </p>
                </div>
                <div className="vc-bar-track">
                  <div className="vc-bar-fill" style={{ width: `${completionPercent(profile)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Main form card ── */}
          <div className="fu fu3">
            <form onSubmit={handleSave} noValidate>
              <div className="vc-card">

                {/* Card header */}
                <div className="vc-section-header">
                  <div>
                    <h1 className="syne" style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>
                      Edit Profile
                    </h1>
                    <p style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>
                      This is how others on VibeCircle will see you.
                    </p>
                  </div>
                  {isComplete && (
                    <span style={{
                      fontSize: 11, padding: "4px 10px", borderRadius: 99,
                      background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
                      color: "var(--success)", fontWeight: 600, letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}>
                      Ready
                    </span>
                  )}
                </div>

                {/* Form body */}
                <div className="vc-form-body">

                  {/* Row 1: Name + Profession */}
                  <div className="vc-form-grid fu fu4">
                    <Field
                      label="Full Name"
                      error={touched.name ? errors.name : undefined}
                      icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                    >
                      <input
                        className={`vc-input${touched.name && errors.name ? " err" : ""}`}
                        type="text"
                        placeholder="Alex Rivera"
                        value={profile.name}
                        onChange={set("name")}
                        onBlur={() => touch("name")}
                        disabled={saving}
                        autoComplete="name"
                      />
                    </Field>
                    <Field
                      label="Profession"
                      error={touched.profession ? errors.profession : undefined}
                      icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>}
                    >
                      <input
                        className={`vc-input${touched.profession && errors.profession ? " err" : ""}`}
                        type="text"
                        placeholder="UX Designer"
                        value={profile.profession}
                        onChange={set("profession")}
                        onBlur={() => touch("profession")}
                        disabled={saving}
                      />
                    </Field>
                  </div>

                  {/* City */}
                  <div className="fu fu4">
                    <Field
                      label="City"
                      error={touched.city ? errors.city : undefined}
                      hint="Where are you based?"
                      icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
                    >
                      <input
                        className={`vc-input${touched.city && errors.city ? " err" : ""}`}
                        type="text"
                        placeholder="San Francisco, CA"
                        value={profile.city}
                        onChange={set("city")}
                        onBlur={() => touch("city")}
                        disabled={saving}
                        autoComplete="address-level2"
                      />
                    </Field>
                  </div>

                  {/* Hobbies */}
                  <div className="fu fu5">
                    <Field
                      label="Hobbies & Interests"
                      hint={`${hobbyList.length}/8 · Press Enter or comma to add`}
                      icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                    >
                      <div
                        className="vc-hobby-box"
                        onClick={() => hobbyInputRef.current?.focus()}
                      >
                        {hobbyList.map(h => (
                          <HobbyTag key={h} label={h} onRemove={() => removeHobby(h)} disabled={saving} />
                        ))}
                        {hobbyList.length < 8 && (
                          <input
                            ref={hobbyInputRef}
                            className="vc-hobby-input"
                            placeholder={hobbyList.length === 0 ? "Photography, Hiking…" : "Add more…"}
                            value={hobbyInput}
                            onChange={e => { setHobbyInput(e.target.value); setShowSuggestions(true); }}
                            onKeyDown={handleHobbyKey}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                            disabled={saving}
                          />
                        )}
                      </div>
                      {showSuggestions && filteredSuggestions.length > 0 && hobbyList.length < 8 && (
                        <div className="vc-suggestions">
                          {filteredSuggestions.slice(0, 8).map(s => (
                            <button
                              type="button"
                              key={s}
                              className="vc-suggestion-pill"
                              onMouseDown={() => { addHobby(s); setShowSuggestions(false); }}
                            >
                              + {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </Field>
                  </div>

                  {/* Profile Photo URL */}
<div className="fu fu5">
  <Field
    label="Profile Photo URL"
    hint="Paste image URL"
    icon={
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 15V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10" />
        <circle cx="9" cy="9" r="2" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    }
  >
    <input
      className="vc-input"
      type="text"
      placeholder="https://..."
      value={profile.photoURL}
      onChange={set("photoURL")}
    />
  </Field>
</div>

{/* Bio */}
<div className="fu fu6">
  <Field
    label="Bio"
    error={touched.bio ? errors.bio : undefined}
    icon={
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    }
  >
    <>
      <textarea
        className={`vc-textarea${
          touched.bio && errors.bio ? " err" : ""
        }`}
        placeholder="Tell the circle a bit about yourself — your story, what drives you, or what you're looking to connect over…"
        value={profile.bio}
        onChange={set("bio")}
        onBlur={() => touch("bio")}
        disabled={saving}
        maxLength={MAX_BIO + 10}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 5,
        }}
      >
        <span
          style={{
            fontSize: 11.5,
            color:
              bioRemaining < 20
                ? "var(--warn)"
                : "var(--text-3)",
            transition: "color 0.2s",
          }}
        >
          {bioRemaining} / {MAX_BIO}
        </span>
      </div>
    </>
  </Field>
                  </div>

                {/* Footer */}
                <div className="vc-form-footer fu fu7">
  <div style={{ flex: 1, minWidth: 0 }}>
    {saveStatus === "success" && (
      <div
        className="vc-banner"
        style={{
          background:
            "rgba(52,211,153,0.08)",
          border:
            "1px solid rgba(52,211,153,0.2)",
          color: "var(--success)",
        }}
      >
        Profile saved successfully!
      </div>
    )}

    {saveStatus === "error" && (
      <div
        className="vc-banner"
        style={{
          background:
            "rgba(248,113,113,0.08)",
          border:
            "1px solid rgba(248,113,113,0.2)",
          color: "var(--error)",
        }}
      >
        {errorMessage}
      </div>
    )}
  </div>

  <button
    type="submit"
    className="vc-btn-save"
    disabled={saving}
  >
    {saving ? (
      <>
        <Spinner size={16} />
        Saving...
      </>
    ) : (
      "Save Profile"
    )}
  </button>
</div>

                </div>

              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Completion helper ────────────────────────────────────────────────────────
function completionPercent(
  profile: UserProfile
): number {

  const fields: (
    keyof UserProfile
  )[] = [
    "name",
    "profession",
    "hobbies",
    "city",
    "bio",
    "photoURL",
  ];

  const filled = fields.filter(
    (f) =>
      profile[f]
        .trim()
        .length > 0
  ).length;

  return Math.round(
    (filled / fields.length) * 100
  );

}

