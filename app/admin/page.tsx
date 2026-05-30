"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/config";
import {
  createEvent,
  getAllEvents,
  deleteEvent,
  updateEvent,
  getEventRegistrations,
  updateRegistrationStatus,
  isAdmin,
  getPendingUserEvents,
  approveEvent,
  rejectEvent,
  getRefundRequests,
  updateRefundStatus,
  getAllUsers,
} from "@/lib/firestore";
import type { PartyEvent, Registration, UserSummary } from "@/types";
import type { RefundRequest } from "@/lib/firestore";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import {
  Plus,
  Trash2,
  Users,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Zap,
  LogOut,
  IndianRupee,
  Image,
  GripVertical,
} from "lucide-react";
import { signOut } from "firebase/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const CATEGORIES = ["Party", "Networking", "Music", "Art", "Sports", "Tech", "Food", "Other"];
const GRADIENTS = [
  "bg-gradient-to-br from-blue-900 to-indigo-900",
  "bg-gradient-to-br from-violet-900 to-purple-900",
  "bg-gradient-to-br from-rose-900 to-pink-900",
  "bg-gradient-to-br from-emerald-900 to-teal-900",
  "bg-gradient-to-br from-amber-900 to-orange-900",
  "bg-gradient-to-br from-slate-800 to-blue-900",
];

// ─── Create Event Form ────────────────────────────────────────────────────────

interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  address: string;
  category: string;
  maxAttendees: number;
  ticketPrice: number;
  coverImage: string;
}

const EMPTY_FORM: EventFormData = {
  title: "",
  description: "",
  date: "",
  time: "20:00",
  location: "",
  address: "",
  category: "Party",
  maxAttendees: 50,
  ticketPrice: 499,
  coverImage: GRADIENTS[0],
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const [events, setEvents] = useState<PartyEvent[]>([]);
  const [tab, setTab] = useState<"events" | "create" | "registrations" | "hero" | "approve" | "users" | "refunds">("events");
  const [form, setForm] = useState<EventFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [selectedEvent, setSelectedEvent] = useState<PartyEvent | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  // Hero images state
  interface HeroImg { id: string; url: string; caption: string; order: number; }
  const [heroImages, setHeroImages] = useState<HeroImg[]>([]);
  const [heroUrl, setHeroUrl] = useState("");
  const [heroCaption, setHeroCaption] = useState("");
  const [addingHero, setAddingHero] = useState(false);

  // Pending events
  const [pendingEvents, setPendingEvents] = useState<PartyEvent[]>([]);
  // Users
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [userSearch, setUserSearch] = useState("");
  // Refunds
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);

  // Auth check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUid(user.uid);
      const admin = await isAdmin(user.uid);
      if (!admin) {
        router.push("/dashboard");
        return;
      }
      setAuthorized(true);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  // Load events
  useEffect(() => {
    if (!authorized) return;
    getAllEvents().then(setEvents);
    getPendingUserEvents().then(setPendingEvents);
    getAllUsers().then(setUsers);
    getRefundRequests().then(setRefunds);
    // Load hero images
    const loadHero = async () => {
      const q = query(collection(db, "heroImages"), orderBy("order", "asc"));
      const snap = await getDocs(q);
      setHeroImages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as HeroImg)));
    };
    loadHero();
  }, [authorized]);

  // Load registrations when event selected
  useEffect(() => {
    if (!selectedEvent) return;
    setLoadingRegs(true);
    getEventRegistrations(selectedEvent.id).then((regs) => {
      setRegistrations(regs);
      setLoadingRegs(false);
    });
  }, [selectedEvent]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.location) {
      setFormError("Title, date and location are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const now = new Date();
      const regDeadline = addDays(now, 7);
      const payDeadline = addDays(new Date(regDeadline), 2);
      await createEvent({
        ...form,
        status: "registration_open",
        registrationDeadline: regDeadline,
        paymentDeadline: payDeadline,
        createdBy: uid!,
        createdByName: "Admin",
        isUserEvent: false,
      });
      const updated = await getAllEvents();
      setEvents(updated);
      setForm(EMPTY_FORM);
      setTab("events");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create event.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    await deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleStatusChange = async (eventId: string, status: PartyEvent["status"]) => {
    await updateEvent(eventId, { status });
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, status } : e)));
  };

  const handleRegStatus = async (regId: string, status: Registration["status"]) => {
    await updateRegistrationStatus(regId, status);
    setRegistrations((prev) =>
      prev.map((r) => (r.id === regId ? { ...r, status } : r))
    );
  };

  const handleApproveEvent = async (event: PartyEvent) => {
    await approveEvent(event.id, event.createdBy, event.title);
    setPendingEvents((prev) => prev.filter((e) => e.id !== event.id));
    setEvents((prev) => prev.map((e) => e.id === event.id ? { ...e, approved: true } : e));
  };

  const handleRejectEvent = async (event: PartyEvent) => {
    await rejectEvent(event.id, event.createdBy, event.title);
    setPendingEvents((prev) => prev.filter((e) => e.id !== event.id));
  };

  const handleRefundStatus = async (refundId: string, status: "approved" | "rejected") => {
    await updateRefundStatus(refundId, status);
    setRefunds((prev) => prev.map((r) => r.id === refundId ? { ...r, status } : r));
  };

  // Hero image handlers
  const handleAddHeroImage = async () => {
    if (!heroUrl.trim()) return;
    setAddingHero(true);
    try {
      const ref = await addDoc(collection(db, "heroImages"), {
        url: heroUrl.trim(),
        caption: heroCaption.trim(),
        order: heroImages.length,
        createdAt: serverTimestamp(),
      });
      setHeroImages((prev) => [...prev, { id: ref.id, url: heroUrl.trim(), caption: heroCaption.trim(), order: prev.length }]);
      setHeroUrl("");
      setHeroCaption("");
    } finally {
      setAddingHero(false);
    }
  };

  const handleDeleteHeroImage = async (id: string) => {
    await deleteDoc(doc(db, "heroImages", id));
    setHeroImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleMoveHero = async (id: string, dir: -1 | 1) => {
    const idx = heroImages.findIndex((img) => img.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= heroImages.length) return;
    const updated = [...heroImages];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    const reordered = updated.map((img, i) => ({ ...img, order: i }));
    setHeroImages(reordered);
    await Promise.all(reordered.map((img) => updateDoc(doc(db, "heroImages", img.id), { order: img.order })));
  };

  if (loading) return <LoadingScreen />;
  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#050B18] text-white">
      {/* ── Top bar ── */}
      <header className="border-b border-white/8 bg-[#080F1E]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">
              Vibe<span className="text-blue-400">Circle</span>
              <span className="ml-2 text-xs font-normal text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                Admin
              </span>
            </span>
          </div>
          <button
            onClick={() => signOut(auth).then(() => router.push("/login"))}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-8 border-b border-white/8 pb-0 overflow-x-auto">
          {([
            { key: "events", label: "All Events" },
            { key: "approve", label: `✅ Approve (${pendingEvents.length})` },
            { key: "create", label: "Create Event" },
            { key: "registrations", label: "Registrations" },
            { key: "users", label: "Users" },
            { key: "refunds", label: `💸 Refunds (${refunds.filter(r=>r.status==="pending").length})` },
            { key: "hero", label: "🖼 Hero Images" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                tab === t.key ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Events Tab ── */}
        {tab === "events" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Events ({events.length})</h2>
              <button
                onClick={() => setTab("create")}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" />
                New Event
              </button>
            </div>

            {events.length === 0 ? (
              <EmptyState message="No events yet. Create your first party!" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {events.map((event) => (
                  <AdminEventCard
                    key={event.id}
                    event={event}
                    onDelete={() => handleDelete(event.id)}
                    onStatusChange={(s) => handleStatusChange(event.id, s)}
                    onViewRegs={() => {
                      setSelectedEvent(event);
                      setTab("registrations");
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Create Tab ── */}
        {tab === "create" && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold mb-6">Create New Event</h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-5">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                  Basic Info
                </h3>

                <FormField label="Event Title">
                  <input
                    className="vc-admin-input"
                    placeholder="Summer Rooftop Party 2026"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </FormField>

                <FormField label="Description">
                  <textarea
                    className="vc-admin-input resize-none"
                    rows={3}
                    placeholder="Tell people what to expect at this party..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Date">
                    <input
                      type="date"
                      className="vc-admin-input"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </FormField>
                  <FormField label="Time">
                    <input
                      type="time"
                      className="vc-admin-input"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                    />
                  </FormField>
                </div>

                <FormField label="Category">
                  <select
                    className="vc-admin-input"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-5">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                  Venue & Capacity
                </h3>

                <FormField label="City / Area">
                  <input
                    className="vc-admin-input"
                    placeholder="Delhi, Hauz Khas"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    required
                  />
                </FormField>

                <FormField label="Full Address">
                  <input
                    className="vc-admin-input"
                    placeholder="123, Party Lane, Hauz Khas Village"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Max Attendees">
                    <input
                      type="number"
                      min={1}
                      className="vc-admin-input"
                      value={form.maxAttendees}
                      onChange={(e) =>
                        setForm({ ...form, maxAttendees: Number(e.target.value) })
                      }
                    />
                  </FormField>
                  <FormField label="Ticket Price (₹)">
                    <input
                      type="number"
                      min={0}
                      className="vc-admin-input"
                      value={form.ticketPrice}
                      onChange={(e) =>
                        setForm({ ...form, ticketPrice: Number(e.target.value) })
                      }
                    />
                  </FormField>
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                  Cover Photo / Style
                </h3>

                {/* Photo URL */}
                <FormField label="Photo URL (optional)">
                  <input
                    className="vc-admin-input"
                    placeholder="https://example.com/party-photo.jpg"
                    value={form.coverImage.startsWith("http") ? form.coverImage : ""}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setForm({ ...form, coverImage: val || GRADIENTS[0] });
                    }}
                  />
                  {form.coverImage.startsWith("http") && (
                    <div className="mt-2 relative h-20 rounded-xl overflow-hidden bg-white/5">
                      <img
                        src={form.coverImage}
                        alt="preview"
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, coverImage: GRADIENTS[0] })}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded-lg"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </FormField>

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
                      key={g}
                      type="button"
                      onClick={() => setForm({ ...form, coverImage: g })}
                      className={`w-14 h-10 rounded-xl ${g} transition-all ${
                        form.coverImage === g
                          ? "ring-2 ring-white ring-offset-2 ring-offset-[#050B18]"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300">
                <p className="font-semibold mb-1">Automatic Deadlines</p>
                <p className="text-blue-400/80">
                  Registration deadline: 7 days from now · Payment deadline: 2 days after registration closes
                </p>
              </div>

              {formError && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {formError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-all"
                >
                  {saving ? "Creating..." : "Create Event"}
                </button>
                <button
                  type="button"
                  onClick={() => { setForm(EMPTY_FORM); setTab("events"); }}
                  className="px-6 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Registrations Tab ── */}
        {tab === "registrations" && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xl font-bold">Registrations</h2>
              {selectedEvent && (
                <span className="text-sm text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                  {selectedEvent.title}
                </span>
              )}
            </div>

            {!selectedEvent ? (
              <div>
                <p className="text-slate-400 mb-4 text-sm">Select an event to view registrations:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="text-left bg-white/[0.03] border border-white/8 hover:border-white/16 rounded-xl p-4 transition-all"
                    >
                      <p className="font-semibold text-white mb-1">{ev.title}</p>
                      <p className="text-slate-500 text-sm">{ev.location} · {fmtDate(ev.date)}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : loadingRegs ? (
              <LoadingScreen />
            ) : registrations.length === 0 ? (
              <EmptyState message="No registrations yet for this event." />
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3 mb-4 text-sm text-slate-400">
                  <span>Total: {registrations.length}</span>
                  <span>·</span>
                  <span className="text-emerald-400">
                    Paid: {registrations.filter((r) => r.status === "paid").length}
                  </span>
                  <span>·</span>
                  <span className="text-amber-400">
                    Pending: {registrations.filter((r) => r.status === "pending").length}
                  </span>
                  <span>·</span>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-blue-400 hover:text-blue-300 ml-auto"
                  >
                    ← Change event
                  </button>
                </div>

                {registrations.map((reg) => (
                  <RegistrationRow
                    key={reg.id}
                    reg={reg}
                    onApprove={() => handleRegStatus(reg.id, "approved")}
                    onReject={() => handleRegStatus(reg.id, "rejected")}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Approve Parties Tab ── */}
        {tab === "approve" && (
          <div>
            <h2 className="text-xl font-bold mb-2">Pending Approval ({pendingEvents.length})</h2>
            <p className="text-slate-400 text-sm mb-6">User-submitted events waiting for review before going live.</p>
            {pendingEvents.length === 0 ? (
              <EmptyState message="No events pending approval. All clear!" />
            ) : (
              <div className="space-y-4">
                {pendingEvents.map((event) => (
                  <div key={event.id} className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden ${event.coverImage.startsWith("http") ? "" : event.coverImage}`}>
                        {event.coverImage.startsWith("http") && <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold mb-1">{event.title}</h3>
                        <p className="text-slate-400 text-sm mb-2 line-clamp-2">{event.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
                          <span>By: <span className="text-violet-400">{event.createdByName}</span></span>
                          <span>{fmtDate(event.date)} · {event.time}</span>
                          <span>{event.location}</span>
                          <span>₹{event.ticketPrice} · {event.maxAttendees} max</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveEvent(event)} className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-xl transition-all">
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button onClick={() => handleRejectEvent(event)} className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold px-4 py-2 rounded-xl transition-all">
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                          <a href={`/events/${event.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-white/5 border border-white/8 text-slate-400 hover:text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all">
                            <Eye className="w-3.5 h-3.5" /> Preview
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Users Tab ── */}
        {tab === "users" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Users ({users.length})</h2>
              <input
                className="vc-admin-input max-w-xs"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              {users
                .filter((u) =>
                  !userSearch ||
                  u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                  u.uid.includes(userSearch)
                )
                .map((user) => (
                  <div key={user.uid} className="flex items-center gap-3 bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(user.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{user.name ?? "Unknown"}</p>
                      <p className="text-slate-500 text-xs truncate">{user.uid}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
                      {user.city && <span>{user.city}</span>}
                      <span>{user.followersCount ?? 0} followers</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── Refunds Tab ── */}
        {tab === "refunds" && (
          <div>
            <h2 className="text-xl font-bold mb-5">Refund Requests ({refunds.length})</h2>
            {refunds.length === 0 ? (
              <EmptyState message="No refund requests yet." />
            ) : (
              <div className="space-y-3">
                {refunds.map((refund) => (
                  <div key={refund.id} className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm">{refund.userName}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{refund.userEmail}</p>
                        <p className="text-slate-500 text-xs mt-1">Event: <span className="text-slate-300">{refund.eventTitle}</span></p>
                        <p className="text-slate-500 text-xs">Amount: <span className="text-emerald-400 font-semibold">₹{refund.amount}</span></p>
                        <p className="text-slate-500 text-xs mt-1">Reason: {refund.reason}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          refund.status === "pending" ? "text-amber-400 bg-amber-400/10 border-amber-400/20" :
                          refund.status === "approved" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" :
                          "text-red-400 bg-red-400/10 border-red-400/20"
                        }`}>
                          {refund.status}
                        </span>
                        {refund.status === "pending" && (
                          <div className="flex gap-2">
                            <button onClick={() => handleRefundStatus(refund.id, "approved")} className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-all">Approve</button>
                            <button onClick={() => handleRefundStatus(refund.id, "rejected")} className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-all">Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Hero Images Tab ── */}
        {tab === "hero" && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold mb-2">Home Page Hero Images</h2>
            <p className="text-slate-400 text-sm mb-6">
              These images appear as a slideshow on the public home page. Add real party photos to make it feel alive.
            </p>
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 mb-6 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Add New Image</h3>
              <input className="vc-admin-input" placeholder="Image URL (e.g. https://...jpg)" value={heroUrl} onChange={(e) => setHeroUrl(e.target.value)} />
              <input className="vc-admin-input" placeholder="Caption (optional)" value={heroCaption} onChange={(e) => setHeroCaption(e.target.value)} />
              {heroUrl && (
                <div className="relative h-32 rounded-xl overflow-hidden bg-white/5">
                  <img src={heroUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
              <button onClick={handleAddHeroImage} disabled={addingHero || !heroUrl.trim()} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all">
                <Image className="w-4 h-4" />
                {addingHero ? "Adding..." : "Add to Slideshow"}
              </button>
            </div>
            {heroImages.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-3">🖼</div>
                <p>No hero images yet. Add some party photos above!</p>
                <p className="text-xs mt-2 text-slate-600">Until you add images, the home page shows default Unsplash party photos.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {heroImages.map((img, idx) => (
                  <div key={img.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/8 rounded-xl p-3">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => handleMoveHero(img.id, -1)} disabled={idx === 0} className="text-slate-500 hover:text-white disabled:opacity-20 transition-colors"><GripVertical className="w-4 h-4 rotate-90" /></button>
                      <button onClick={() => handleMoveHero(img.id, 1)} disabled={idx === heroImages.length - 1} className="text-slate-500 hover:text-white disabled:opacity-20 transition-colors"><GripVertical className="w-4 h-4 -rotate-90" /></button>
                    </div>
                    <div className="w-20 h-14 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                      <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{img.caption || "No caption"}</p>
                      <p className="text-slate-500 text-xs truncate">{img.url}</p>
                    </div>
                    <span className="text-slate-600 text-xs flex-shrink-0">#{idx + 1}</span>
                    <button onClick={() => handleDeleteHeroImage(img.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <style>{`
        .vc-admin-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 11px 14px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .vc-admin-input::placeholder { color: #475569; }
        .vc-admin-input:focus {
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .vc-admin-input option { background: #1e293b; }
      `}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function AdminEventCard({
  event,
  onDelete,
  onStatusChange,
  onViewRegs,
}: {
  event: PartyEvent;
  onDelete: () => void;
  onStatusChange: (s: PartyEvent["status"]) => void;
  onViewRegs: () => void;
}) {
  const statusColors: Record<string, string> = {
    registration_open: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    payment_open: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    upcoming: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    closed: "text-slate-400 bg-slate-400/10 border-slate-400/20",
    completed: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  };

  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
      <div className={`h-24 relative overflow-hidden ${event.coverImage.startsWith("http") ? "" : event.coverImage}`}>
        {event.coverImage.startsWith("http") && (
          <img src={event.coverImage} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[event.status] ?? statusColors.upcoming}`}>
            {event.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 leading-snug">{event.title}</h3>
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Calendar className="w-3 h-3" />
            {fmtDate(event.date)} · {event.time}
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <MapPin className="w-3 h-3" />
            {event.location}
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Users className="w-3 h-3" />
            {event.attendeeCount} / {event.maxAttendees} registered
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <IndianRupee className="w-3 h-3" />
            ₹{event.ticketPrice} per ticket
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Clock className="w-3 h-3" />
            Reg. deadline: {fmtDate(event.registrationDeadline)}
          </div>
        </div>

        {/* Status controls */}
        <div className="mb-3">
          <select
            value={event.status}
            onChange={(e) => onStatusChange(e.target.value as PartyEvent["status"])}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"
          >
            <option value="registration_open">Registration Open</option>
            <option value="payment_open">Payment Open</option>
            <option value="upcoming">Upcoming</option>
            <option value="closed">Closed</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onViewRegs}
            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/20 text-blue-300 text-xs font-medium py-2 rounded-lg transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            Registrations
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 text-xs font-medium px-3 py-2 rounded-lg transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function RegistrationRow({
  reg,
  onApprove,
  onReject,
}: {
  reg: Registration;
  onApprove: () => void;
  onReject: () => void;
}) {
  const statusStyle: Record<string, string> = {
    pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    approved: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    rejected: "text-red-400 bg-red-400/10 border-red-400/20",
    paid: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    waitlist: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  };

  return (
    <div className="flex items-center justify-between gap-4 bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
          {reg.userName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{reg.userName}</p>
          <p className="text-slate-500 text-xs truncate">{reg.userEmail}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyle[reg.status] ?? statusStyle.pending}`}
        >
          {reg.status}
        </span>

        {reg.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={onApprove}
              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all"
              title="Approve"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button
              onClick={onReject}
              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
              title="Reject"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#050B18] flex items-center justify-center">
      <div className="text-slate-400 text-sm animate-pulse">Loading...</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-slate-500">
      <div className="text-4xl mb-3">🎉</div>
      <p>{message}</p>
    </div>
  );
}
