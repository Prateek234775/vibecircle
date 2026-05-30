"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/config";
import {
  getUserEvents,
  getEventRegistrations,
  getUserProfile,
} from "@/lib/firestore";
import type { PartyEvent, Registration } from "@/types";
import {
  Zap, ArrowLeft, Calendar, MapPin, Users, IndianRupee,
  TrendingUp, Clock, Eye, ChevronRight, CheckCircle,
  XCircle, AlertCircle, Bell,
} from "lucide-react";
import Link from "next/link";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtCurrency(n: number | undefined) {
  return `₹${(n ?? 0).toLocaleString("en-IN")}`;
}

export default function HostDashboard() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [events, setEvents] = useState<PartyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<PartyEvent | null>(null);
  const [guestList, setGuestList] = useState<Registration[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [tab, setTab] = useState<"parties" | "revenue" | "guests">("parties");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setUid(user.uid);
      const profile = await getUserProfile(user.uid);
      setUserName(profile?.name ?? user.displayName ?? "Host");
      const evs = await getUserEvents(user.uid);
      setEvents(evs);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const loadGuests = async (event: PartyEvent) => {
    setSelectedEvent(event);
    setLoadingGuests(true);
    setTab("guests");
    const regs = await getEventRegistrations(event.id);
    setGuestList(regs);
    setLoadingGuests(false);
  };

  // Revenue stats
  const totalRevenue = events.reduce((sum, ev) => {
    return sum + (ev.hostPayout ?? ev.ticketPrice * 0.95) * (ev.attendeeCount ?? 0);
  }, 0);
  const totalTicketsSold = events.reduce((s, ev) => s + (ev.attendeeCount ?? 0), 0);
  const upcomingCount = events.filter((e) =>
    ["registration_open", "payment_open", "upcoming"].includes(e.status)
  ).length;
  const pendingApproval = events.filter((e) => !e.approved).length;

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Vibe<span className="text-blue-400">Circle</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/notifications" className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </Link>
            <Link href="/dashboard" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="mb-8">
          <div className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-1">Host Dashboard</div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {userName} 🎉</h1>
          {pendingApproval > 0 && (
            <div className="mt-3 flex items-center gap-2 text-amber-400 text-sm bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-2.5 w-fit">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {pendingApproval} event{pendingApproval > 1 ? "s" : ""} pending admin approval
            </div>
          )}
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Tickets Sold", value: totalTicketsSold, icon: "🎟️", color: "text-blue-400" },
            { label: "Est. Revenue", value: fmtCurrency(totalRevenue), icon: "💰", color: "text-emerald-400" },
            { label: "Upcoming Events", value: upcomingCount, icon: "📅", color: "text-violet-400" },
            { label: "Total Events", value: events.length, icon: "🎉", color: "text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color} mb-1`}>{s.value}</div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-white/8">
          {(["parties", "revenue", "guests"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
                tab === t ? "border-violet-500 text-white" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {t === "parties" ? "My Parties" : t === "revenue" ? "Revenue" : "Guest List"}
            </button>
          ))}
        </div>

        {/* My Parties Tab */}
        {tab === "parties" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">All Your Parties ({events.length})</h2>
              <Link
                href="/events/create"
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
              >
                + New Party
              </Link>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <div className="text-5xl mb-4">🎉</div>
                <p className="text-lg font-medium text-slate-400 mb-2">No parties yet</p>
                <p className="text-sm mb-6">Create your first party and start hosting!</p>
                <Link href="/events/create" className="bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold px-6 py-3 rounded-xl text-sm">
                  Create Party
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <HostEventRow key={event.id} event={event} onViewGuests={() => loadGuests(event)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Revenue Tab */}
        {tab === "revenue" && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold mb-4">Revenue Breakdown</h2>
            {events.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No events yet.</div>
            ) : (
              <>
                {/* Summary */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-4">Total Earnings</p>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-3xl font-bold text-emerald-400">{fmtCurrency(totalRevenue)}</p>
                      <p className="text-slate-500 text-xs mt-1">Your payout (95%)</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">{totalTicketsSold}</p>
                      <p className="text-slate-500 text-xs mt-1">Tickets sold</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-amber-400">{fmtCurrency(Math.round(totalRevenue / 0.95 * 0.05))}</p>
                      <p className="text-slate-500 text-xs mt-1">Platform fee (5%)</p>
                    </div>
                  </div>
                </div>

                {/* Per-event breakdown */}
                <div className="space-y-3">
                  {events.map((event) => {
                    const hostPayout = event.hostPayout ?? Math.round(event.ticketPrice * 0.95);
                    const attendeeCount = event.attendeeCount ?? 0;
                    const revenue = hostPayout * attendeeCount;
                    const pct = event.maxAttendees > 0 ? Math.round((attendeeCount / event.maxAttendees) * 100) : 0;
                    return (
                      <div key={event.id} className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="min-w-0">
                            <p className="text-white font-semibold text-sm truncate">{event.title}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{fmtDate(event.date)} · {event.location}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-emerald-400 font-bold">{fmtCurrency(revenue)}</p>
                            <p className="text-slate-500 text-xs">{attendeeCount} tickets × {fmtCurrency(hostPayout)}</p>
                          </div>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-slate-600 text-xs mt-1">{attendeeCount}/{event.maxAttendees} spots filled ({pct}%)</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Guest List Tab */}
        {tab === "guests" && (
          <div>
            {!selectedEvent ? (
              <div>
                <p className="text-slate-400 text-sm mb-4">Select a party to view its guest list:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => loadGuests(ev)}
                      className="text-left bg-white/[0.03] border border-white/8 hover:border-white/16 rounded-xl p-4 transition-all"
                    >
                      <p className="font-semibold text-white mb-1 truncate">{ev.title}</p>
                      <p className="text-slate-500 text-xs">{ev.attendeeCount} guests · {fmtDate(ev.date)}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <button onClick={() => { setSelectedEvent(null); setGuestList([]); }} className="text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-lg font-semibold">{selectedEvent.title}</h2>
                    <p className="text-slate-500 text-xs">{fmtDate(selectedEvent.date)} · {selectedEvent.location}</p>
                  </div>
                  <div className="ml-auto flex gap-3 text-sm text-slate-400">
                    <span className="text-emerald-400 font-semibold">{guestList.filter(g => g.status === "paid").length} paid</span>
                    <span>·</span>
                    <span className="text-amber-400">{guestList.filter(g => g.status === "pending").length} pending</span>
                    <span>·</span>
                    <span>{selectedEvent.maxAttendees - selectedEvent.attendeeCount} slots left</span>
                  </div>
                </div>

                {loadingGuests ? (
                  <div className="text-slate-400 text-sm animate-pulse py-8 text-center">Loading guests...</div>
                ) : guestList.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">No registrations yet.</div>
                ) : (
                  <div className="space-y-2">
                    {guestList.map((guest, i) => (
                      <div key={guest.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3">
                        <span className="text-slate-600 text-xs w-5 flex-shrink-0">{i + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {guest.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{guest.userName}</p>
                          <p className="text-slate-500 text-xs truncate">{guest.userEmail}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {guest.status === "paid" && (
                            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" /> Paid
                            </span>
                          )}
                          {guest.status === "pending" && (
                            <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                          {guest.status === "approved" && (
                            <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" /> Approved
                            </span>
                          )}
                          {guest.status === "rejected" && (
                            <span className="flex items-center gap-1 text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                          )}
                          {guest.paidAt && (
                            <span className="text-slate-600 text-xs">{fmtDate(guest.paidAt)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function HostEventRow({ event, onViewGuests }: { event: PartyEvent; onViewGuests: () => void }) {
  const attendeeCount = event.attendeeCount ?? 0;
  const slotsLeft = event.maxAttendees - attendeeCount;
  const pct = Math.min((attendeeCount / event.maxAttendees) * 100, 100);
  const hostPayout = event.hostPayout ?? Math.round(event.ticketPrice * 0.95);

  const statusColor: Record<string, string> = {
    registration_open: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    payment_open: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    upcoming: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    closed: "text-slate-400 bg-slate-400/10 border-slate-400/20",
    completed: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  };

  return (
    <div className="bg-white/[0.03] border border-white/8 hover:border-white/14 rounded-2xl p-5 transition-all">
      <div className="flex items-start gap-4">
        {/* Cover thumbnail */}
        <div className={`w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden ${event.coverImage.startsWith("http") ? "" : event.coverImage}`}>
          {event.coverImage.startsWith("http") && (
            <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-semibold text-sm truncate">{event.title}</h3>
                {!event.approved && (
                  <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full flex-shrink-0">
                    Pending Approval
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-slate-500 text-xs">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(event.date)}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${statusColor[event.status] ?? statusColor.upcoming}`}>
              {event.status.replace("_", " ")}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{attendeeCount}/{event.maxAttendees} guests</span>
            <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />₹{hostPayout} payout/ticket</span>
            <span className="text-emerald-400 font-semibold">₹{(hostPayout * attendeeCount).toLocaleString("en-IN")} earned</span>
          </div>

          {/* Capacity bar */}
          <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onViewGuests}
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-lg transition-all"
            >
              <Users className="w-3.5 h-3.5" /> Guest List
            </button>
            <Link
              href={`/events/${event.id}`}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/5 border border-white/8 px-3 py-1.5 rounded-lg transition-all"
            >
              <Eye className="w-3.5 h-3.5" /> View Event
            </Link>
            <span className="ml-auto text-slate-600 text-xs">{slotsLeft} slots left</span>
          </div>
        </div>
      </div>
    </div>
  );
}
