"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/config";
import { getAllEvents } from "@/lib/firestore";
import type { PartyEvent } from "@/types";
import {
  Calendar, MapPin, Users, Clock, IndianRupee, Search,
  Zap, ArrowRight, Filter, X, SlidersHorizontal, Map,
} from "lucide-react";
import Link from "next/link";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeLeft(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_LABEL: Record<string, string> = {
  registration_open: "Registration Open",
  payment_open: "Payment Open",
  upcoming: "Upcoming",
  closed: "Closed",
  completed: "Completed",
};

const STATUS_COLOR: Record<string, string> = {
  registration_open: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  payment_open: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  upcoming: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  closed: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  completed: "text-violet-400 bg-violet-400/10 border-violet-400/20",
};

const CATEGORIES = ["All", "Party", "Networking", "Music", "Art", "Sports", "Tech", "Food", "Other"];
const PRICE_RANGES = [
  { label: "Any Price", min: 0, max: Infinity },
  { label: "Free", min: 0, max: 0 },
  { label: "Under ₹500", min: 1, max: 499 },
  { label: "₹500–₹1000", min: 500, max: 1000 },
  { label: "₹1000+", min: 1001, max: Infinity },
];

// ─── Google Maps Modal ────────────────────────────────────────────────────────

function MapModal({ event, onClose }: { event: PartyEvent; onClose: () => void }) {
  const query = encodeURIComponent(event.address || event.location);
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ""}&q=${query}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0d1424] border border-white/10 rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <p className="text-white font-semibold text-sm">{event.title}</p>
            <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" />{event.address || event.location}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-all"
            >
              Open in Maps
            </a>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ? (
          <iframe
            src={embedUrl}
            width="100%"
            height="380"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map for ${event.title}`}
          />
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Map className="w-10 h-10 opacity-30" />
            <p className="text-sm">Add NEXT_PUBLIC_GOOGLE_MAPS_KEY to .env.local to enable maps</p>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm underline">
              Open in Google Maps instead →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<PartyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("");
  const [priceRange, setPriceRange] = useState(0); // index into PRICE_RANGES
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Map modal
  const [mapEvent, setMapEvent] = useState<PartyEvent | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
      else setAuthChecked(true);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    getAllEvents().then((data) => {
      // Only show approved events to users
      setEvents(data.filter((e) => e.approved !== false));
      setLoading(false);
    });
  }, [authChecked]);

  // Unique cities from events
  const cities = useMemo(() => {
    const set = new Set(events.map((e) => e.location.split(",")[0].trim()));
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    const pr = PRICE_RANGES[priceRange];
    return events.filter((e) => {
      const matchSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.location.toLowerCase().includes(search.toLowerCase()) ||
        e.description?.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All" || e.category === category;
      const matchCity = !city || e.location.toLowerCase().includes(city.toLowerCase());
      const matchPrice = e.ticketPrice >= pr.min && e.ticketPrice <= pr.max;
      const matchDateFrom = !dateFrom || e.date >= dateFrom;
      const matchDateTo = !dateTo || e.date <= dateTo;
      return matchSearch && matchCat && matchCity && matchPrice && matchDateFrom && matchDateTo;
    });
  }, [events, search, category, city, priceRange, dateFrom, dateTo]);

  const activeFilters = [
    category !== "All" && category,
    city && `City: ${city}`,
    priceRange !== 0 && PRICE_RANGES[priceRange].label,
    dateFrom && `From: ${dateFrom}`,
    dateTo && `To: ${dateTo}`,
  ].filter(Boolean) as string[];

  const clearFilters = () => {
    setCategory("All");
    setCity("");
    setPriceRange(0);
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="min-h-screen bg-[#050B18] text-white">
      {/* Header */}
      <header className="border-b border-white/8 bg-[#080F1E]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Vibe<span className="text-blue-400">Circle</span></span>
          </Link>
          <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">← Dashboard</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <div className="mb-8">
          <div className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-2">House Parties</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Find Your Next Vibe</h1>
          <p className="text-slate-400 max-w-xl text-sm">Register for exclusive house parties, pay your ticket, and join the group chat.</p>
        </div>

        {/* Search + Filter toggle */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search events, cities, descriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
              showFilters || activeFilters.length > 0
                ? "bg-blue-600/20 border-blue-500/30 text-blue-300"
                : "bg-white/[0.04] border-white/8 text-slate-400 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilters.length > 0 && (
              <span className="bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 mb-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* City */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all"
                >
                  <option value="">All Cities</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Price</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all"
                >
                  {PRICE_RANGES.map((p, i) => <option key={p.label} value={i}>{p.label}</option>)}
                </select>
              </div>

              {/* Date from */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all"
                />
              </div>

              {/* Date to */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            {/* Category pills */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      category === cat
                        ? "bg-blue-600 text-white"
                        : "bg-white/[0.04] border border-white/8 text-slate-400 hover:text-white hover:border-white/16"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {activeFilters.length > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors">
                <X className="w-3.5 h-3.5" /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Active filter chips */}
        {activeFilters.length > 0 && !showFilters && (
          <div className="flex flex-wrap gap-2 mb-5">
            {activeFilters.map((f) => (
              <span key={f} className="flex items-center gap-1.5 text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
                {f}
              </span>
            ))}
            <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-white transition-colors px-2">
              Clear all
            </button>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-slate-400 text-sm">
            {loading ? "Loading..." : `${filtered.length} event${filtered.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/[0.03] border border-white/8 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-lg font-medium text-slate-400 mb-2">No events found</p>
            <p className="text-sm">Try adjusting your filters or check back later.</p>
            {activeFilters.length > 0 && (
              <button onClick={clearFilters} className="mt-4 text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} onShowMap={() => setMapEvent(event)} />
            ))}
          </div>
        )}
      </div>

      {/* Map Modal */}
      {mapEvent && <MapModal event={mapEvent} onClose={() => setMapEvent(null)} />}
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event, onShowMap }: { event: PartyEvent; onShowMap: () => void }) {
  const isOpen = event.status === "registration_open";
  const isPayment = event.status === "payment_open";
  const deadline = isOpen ? event.registrationDeadline : isPayment ? event.paymentDeadline : null;
  const slotsLeft = event.maxAttendees - event.attendeeCount;

  return (
    <article className="group bg-white/[0.03] border border-white/8 hover:border-white/16 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/20 flex flex-col h-full">
      {/* Cover */}
      <div className={`relative h-44 overflow-hidden ${event.coverImage.startsWith("http") ? "" : event.coverImage} flex items-end p-5`}>
        {event.coverImage.startsWith("http") && (
          <img src={event.coverImage} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute top-4 right-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLOR[event.status] ?? STATUS_COLOR.upcoming}`}>
            {STATUS_LABEL[event.status]}
          </span>
        </div>
        <span className="relative z-10 text-xs font-medium bg-white/10 border border-white/20 text-white px-2.5 py-1 rounded-full">
          {event.category}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-white font-semibold text-base leading-snug mb-1 group-hover:text-blue-300 transition-colors">
          {event.title}
        </h3>
        {/* Host */}
        <p className="text-slate-500 text-xs mb-3">
          by{" "}
          {event.isUserEvent ? (
            <span className="text-violet-400">{event.createdByName}</span>
          ) : (
            <span className="text-blue-400">VibeCircle</span>
          )}
        </p>

        <div className="space-y-1.5 mb-4 mt-auto">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Calendar className="w-3.5 h-3.5 text-blue-400/70 flex-shrink-0" />
            {fmtDate(event.date)} · {event.time}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <MapPin className="w-3.5 h-3.5 text-blue-400/70 flex-shrink-0" />
              {event.location}
            </div>
            <button
              onClick={(e) => { e.preventDefault(); onShowMap(); }}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <Map className="w-3 h-3" /> Map
            </button>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Users className="w-3.5 h-3.5 text-blue-400/70 flex-shrink-0" />
            <span className={slotsLeft <= 5 && slotsLeft > 0 ? "text-amber-400 font-medium" : ""}>
              {slotsLeft > 0 ? `${slotsLeft} slots left` : "Full"}
            </span>
            <span className="text-slate-600">of {event.maxAttendees}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <IndianRupee className="w-3.5 h-3.5 text-blue-400/70 flex-shrink-0" />
            {event.ticketPrice === 0 ? <span className="text-emerald-400 font-medium">Free</span> : `₹${event.ticketPrice}`}
          </div>
        </div>

        {deadline && (
          <div className="flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2 mb-4">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            {isOpen ? "Registration" : "Payment"} closes in {timeLeft(deadline)}
          </div>
        )}

        <Link
          href={`/events/${event.id}`}
          className="flex items-center justify-between text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors"
        >
          <span>{isOpen ? "Register Now" : isPayment ? "Pay & Join" : "View Details"}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </article>
  );
}
