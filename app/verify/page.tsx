"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/config";
import {
  getUserProfile,
  submitAadhaarVerification,
  getAadhaarStatus,
} from "@/lib/firestore";
import {
  Zap, ArrowLeft, ShieldCheck, Clock, CheckCircle,
  XCircle, AlertCircle, Lock, Eye, EyeOff,
} from "lucide-react";
import Link from "next/link";

type VerifyStatus = "none" | "pending" | "verified" | "rejected";

export default function VerifyPage() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [status, setStatus] = useState<VerifyStatus>("none");
  const [loading, setLoading] = useState(true);

  // Form
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [nameOnAadhaar, setNameOnAadhaar] = useState("");
  const [dob, setDob] = useState("");
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setUid(user.uid);
      const [profile, verifyStatus] = await Promise.all([
        getUserProfile(user.uid),
        getAadhaarStatus(user.uid),
      ]);
      setUserName(profile?.name ?? user.displayName ?? "User");
      setStatus(verifyStatus);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  // Format Aadhaar as XXXX XXXX XXXX
  const formatAadhaar = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = aadhaarNumber.replace(/\s/g, "");
    if (digits.length !== 12) {
      setError("Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    if (!nameOnAadhaar.trim()) {
      setError("Name as on Aadhaar is required.");
      return;
    }
    if (!dob) {
      setError("Date of birth is required.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await submitAadhaarVerification(
        uid!,
        userName,
        digits.slice(-4),       // store only last 4 digits
        nameOnAadhaar.trim(),
        dob
      );
      setStatus("pending");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050B18] flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050B18] text-white">
      {/* Header */}
      <header className="border-b border-white/8 bg-[#080F1E]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Vibe<span className="text-blue-400">Circle</span></span>
          </Link>
          <Link href="/dashboard" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Aadhaar Verification</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Verify your identity with Aadhaar to unlock event registration on VibeCircle.
            Only verified members can register for parties.
          </p>
        </div>

        {/* Status cards */}
        {status === "verified" && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white mb-1">You&apos;re Verified! ✅</h2>
            <p className="text-slate-400 text-sm">Your Aadhaar identity has been confirmed. You can register for any event.</p>
            <Link href="/events" className="mt-4 inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all">
              Browse Events
            </Link>
          </div>
        )}

        {(status === "pending" || submitted) && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center">
            <Clock className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white mb-1">Verification Pending</h2>
            <p className="text-slate-400 text-sm">
              Your Aadhaar details have been submitted. Our team will review and verify within 24 hours.
              You&apos;ll get a notification once approved.
            </p>
          </div>
        )}

        {status === "rejected" && !submitted && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-6 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-semibold text-sm">Previous submission rejected</p>
              <p className="text-slate-400 text-xs mt-0.5">Please resubmit with correct details matching your Aadhaar card.</p>
            </div>
          </div>
        )}

        {/* Form — show for none or rejected */}
        {(status === "none" || status === "rejected") && !submitted && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Privacy notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
              <Lock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-300 leading-relaxed">
                <p className="font-semibold mb-1">Your privacy is protected</p>
                <p className="text-blue-400/80">
                  We store only the last 4 digits of your Aadhaar number. Your full Aadhaar is never saved on our servers.
                  This data is used solely for identity verification and is never shared with third parties.
                </p>
              </div>
            </div>

            {/* Aadhaar number */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Aadhaar Number
              </label>
              <div className="relative">
                <input
                  type={showAadhaar ? "text" : "password"}
                  inputMode="numeric"
                  placeholder="XXXX XXXX XXXX"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(formatAadhaar(e.target.value))}
                  maxLength={14}
                  className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all text-lg tracking-widest font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowAadhaar(!showAadhaar)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showAadhaar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-slate-600 text-xs mt-1.5">12-digit number on your Aadhaar card</p>
            </div>

            {/* Name on Aadhaar */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Name as on Aadhaar
              </label>
              <input
                type="text"
                placeholder="Full name exactly as printed on Aadhaar"
                value={nameOnAadhaar}
                onChange={(e) => setNameOnAadhaar(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                required
              />
            </div>

            {/* Date of birth */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Date of Birth (as on Aadhaar)
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split("T")[0]}
                className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                required
              />
              <p className="text-slate-600 text-xs mt-1.5">Must be 18+ to register for events</p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all text-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              {submitting ? "Submitting..." : "Submit for Verification"}
            </button>

            <p className="text-center text-slate-600 text-xs">
              By submitting, you confirm this is your own Aadhaar and consent to identity verification.
            </p>
          </form>
        )}

        {/* What happens next */}
        {status === "none" && !submitted && (
          <div className="mt-8 bg-white/[0.02] border border-white/6 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">What happens after submission?</h3>
            <div className="space-y-3">
              {[
                { step: "1", text: "Your details are reviewed by our team within 24 hours", color: "bg-blue-500" },
                { step: "2", text: "You receive a notification once verified", color: "bg-violet-500" },
                { step: "3", text: "Verified badge appears on your profile", color: "bg-emerald-500" },
                { step: "4", text: "You can now register for any event on VibeCircle", color: "bg-amber-500" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full ${item.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
                    {item.step}
                  </div>
                  <p className="text-slate-400 text-sm">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
