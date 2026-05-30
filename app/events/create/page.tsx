"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/config";
import { createEvent, getUserProfile, PLATFORM_FEE_PCT } from "@/lib/firestore";
import {
  Zap,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Info,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["Party", "Networking", "Music", "Art", "Sports", "Tech", "Food", "Other"];

const GRADIENTS = [
  { label: "Ocean", value: "bg-gradient-to-br from-blue-900 to-indigo-900" },
  { label: "Violet", value: "bg-gradient-to-br from-violet-900 to-purple-900" },
  { label: "Rose", value: "bg-gradient-to-br from-rose-900 to-pink-900" },
  { label: "Emerald", value: "bg-gradient-to-br from-emerald-900 to-teal-900" },
  { label: "Amber", value: "bg-gradient-to-br from-amber-900 to-orange-900" },
  { label: "Slate", value: "bg-gradient-to-br from-slate-800 to-blue-900" },
];

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateEventPage() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("20:00");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("Party");
  const [maxAttendees, setMaxAttendees] = useState(30);
  const [ticketPrice, setTicketPrice] = useState(499);
  const [coverImage, setCoverImage] = useState(GRADIENTS[0].value);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState("");

  // Fee breakdown
  const platformFee = Math.round(ticketPrice * PLATFORM_FEE_PCT);
  const hostPayout = ticketPrice - platformFee;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setUid(user.uid);
      const profile = await getUserProfile(user.uid);
      setUserName(profile?.name ?? user.displayName ?? "User");
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !location.trim()) {
      setError("Title, date and location are required.");
      return;
    }
    if (ticketPrice < 0) {
      setError("Ticket price cannot be negative.");
      return;
    }
    if (maxAttendees < 2) {
      setError("Event must allow at least 2 attendees.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const now = new Date();
      const regDeadline = addDays(now, 7);
      const payDeadline = addDays(new Date(regDeadline), 2);

      const id = await createEvent({
        title: title.trim(),
        description: description.trim(),
        date,
        time,
        location: location.trim(),
        address: address.trim(),
        category,
        maxAttendees,
        ticketPrice,
        coverImage,
        registrationDeadline: regDeadline,
        paymentDeadline: payDeadline,
        status: "registration_open",
        createdBy: uid!,
        createdByName: userName,
        isUserEvent: true,
      });

      setCreatedId(id);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050B18] flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#050B18] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Event Created!</h1>
          <p className="text-slate-400 mb-6 text-sm leading-relaxed">
            Your event is now live. Registration is open for 7 days, then a 2-day payment window opens.
            You&apos;ll receive <span className="text-emerald-400 font-semibold">₹{hostPayout}</span> per
            ticket sold (after 5% platform fee).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/events/${createdId}`}
              className="bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:from-blue-500 hover:to-violet-500 transition-all"
            >
              View Event
            </Link>
            <Link
              href="/dashboard"
              className="bg-white/5 border border-white/10 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050B18] text-white">
      {/* Header */}
      <header className="border-b border-white/8 bg-[#080F1E]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">
              Vibe<span className="text-blue-400">Circle</span>
            </span>
          </Link>
          <Link
            href="/events"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Events
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <div className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-2">
            Host an Event
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Your Party</h1>
          <p className="text-slate-400 text-sm">
            Anyone can host. Set your ticket price — VibeCircle takes a flat{" "}
            <span className="text-amber-400 font-semibold">5% platform fee</span> per ticket sold.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Section title="Basic Info">
            <Field label="Event Title" icon={<Zap className="w-3.5 h-3.5" />}>
              <input
                className="vc-input"
                placeholder="Summer Rooftop Party 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Field>

            <Field label="Description" icon={<Info className="w-3.5 h-3.5" />}>
              <textarea
                className="vc-input resize-none"
                rows={3}
                placeholder="Tell people what to expect — vibe, dress code, what's included..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Date" icon={<Calendar className="w-3.5 h-3.5" />}>
                <input
                  type="date"
                  className="vc-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </Field>
              <Field label="Time" icon={<Calendar className="w-3.5 h-3.5" />}>
                <input
                  type="time"
                  className="vc-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Category" icon={<Zap className="w-3.5 h-3.5" />}>
              <select
                className="vc-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </Section>

          {/* Venue */}
          <Section title="Venue & Capacity">
            <Field label="City / Area" icon={<MapPin className="w-3.5 h-3.5" />}>
              <input
                className="vc-input"
                placeholder="Delhi, Hauz Khas"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </Field>

            <Field label="Full Address (shared only with paid attendees)" icon={<MapPin className="w-3.5 h-3.5" />}>
              <input
                className="vc-input"
                placeholder="123, Party Lane, Hauz Khas Village"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Field>

            <Field label="Max Attendees" icon={<Users className="w-3.5 h-3.5" />}>
              <input
                type="number"
                min={2}
                max={500}
                className="vc-input"
                value={maxAttendees}
                onChange={(e) => setMaxAttendees(Number(e.target.value))}
              />
            </Field>
          </Section>

          {/* Pricing */}
          <Section title="Ticket Pricing">
            <Field label="Ticket Price (₹)" icon={<IndianRupee className="w-3.5 h-3.5" />}>
              <input
                type="number"
                min={0}
                className="vc-input"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(Number(e.target.value))}
              />
            </Field>

            {/* Fee breakdown card */}
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
                Fee Breakdown per Ticket
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Attendee pays</span>
                  <span className="text-white font-semibold">₹{ticketPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Platform fee (5%)</span>
                  <span className="text-red-400 font-semibold">− ₹{platformFee}</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 font-semibold">You receive</span>
                  <span className="text-emerald-400 font-bold text-base">₹{hostPayout}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                For {maxAttendees} attendees → you earn up to{" "}
                <span className="text-emerald-400 font-semibold">
                  ₹{(hostPayout * maxAttendees).toLocaleString("en-IN")}
                </span>
              </p>
            </div>
          </Section>

          {/* Cover */}
          <Section title="Cover Photo / Style">
            {/* Photo URL input */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <span className="text-blue-400/70"><MapPin className="w-3.5 h-3.5" /></span>
                Photo URL (optional)
              </label>
              <input
                className="vc-input"
                placeholder="https://example.com/party-photo.jpg"
                value={coverImage.startsWith("http") ? coverImage : ""}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setCoverImage(val || GRADIENTS[0].value);
                }}
              />
              {coverImage.startsWith("http") && (
                <div className="mt-2 relative h-24 rounded-xl overflow-hidden bg-white/5">
                  <img
                    src={coverImage}
                    alt="cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setCoverImage(GRADIENTS[0].value)}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded-lg transition-all"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-slate-600 text-xs">or pick a gradient</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Gradient swatches */}
            <div className="flex flex-wrap gap-3">
              {GRADIENTS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setCoverImage(g.value)}
                  className={`relative w-16 h-12 rounded-xl ${g.value} transition-all ${
                    coverImage === g.value
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[#050B18]"
                      : "opacity-50 hover:opacity-80"
                  }`}
                >
                  {coverImage === g.value && (
                    <CheckCircle className="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Preview */}
          <Section title="Preview">
            <div className={`relative h-32 rounded-xl overflow-hidden ${coverImage.startsWith("http") ? "" : coverImage}`}>
              {coverImage.startsWith("http") && (
                <img src={coverImage} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <p className="text-white font-bold text-lg leading-tight">
                  {title || "Your Event Title"}
                </p>
                <p className="text-slate-300 text-xs mt-0.5">
                  {location || "Location"} · {date || "Date"} · ₹{ticketPrice}
                </p>
              </div>
            </div>
          </Section>

          {/* Deadlines info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300 flex gap-3">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
            <div>
              <p className="font-semibold mb-1">Automatic Deadlines</p>
              <p className="text-blue-400/80 text-xs leading-relaxed">
                Registration opens immediately and closes in <strong>7 days</strong>.
                A <strong>2-day payment window</strong> follows. After that, all paid attendees
                are added to the group chat automatically.
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-sm"
            >
              {saving ? "Creating..." : "🎉 Create Event"}
            </button>
            <Link
              href="/events"
              className="px-6 py-3.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-sm transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      <style>{`
        .vc-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 12px 14px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .vc-input::placeholder { color: #475569; }
        .vc-input:focus {
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .vc-input option { background: #1e293b; }
      `}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        <span className="text-blue-400/70">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}
