"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, Calendar, Star, ArrowRight, CheckCircle,
  MapPin, ChevronRight, Zap, Heart, MessageCircle,
  TrendingUp, Lock, Eye, Award, Shield, Search,
  Menu, X, ChevronLeft, Play, Pause,
} from "lucide-react";
import Link from "next/link";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/firebase/config";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeroImage {
  id: string;
  url: string;
  caption?: string;
  order: number;
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? "bg-[#050B18]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              Vibe<span className="text-blue-400">Circle</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/events" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Events</Link>
            <Link href="/people" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">People</Link>
            <Link href="/reviews" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Reviews</Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 inline-block">
              Get Started Free
            </Link>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-slate-400 hover:text-white p-2">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#050B18]/98 backdrop-blur-xl border-b border-white/5 px-4 pb-6 pt-2">
          <div className="flex flex-col gap-4">
            <Link href="/events" className="text-slate-400 hover:text-white text-base font-medium py-1" onClick={() => setMobileOpen(false)}>Events</Link>
            <Link href="/people" className="text-slate-400 hover:text-white text-base font-medium py-1" onClick={() => setMobileOpen(false)}>People</Link>
            <Link href="/reviews" className="text-slate-400 hover:text-white text-base font-medium py-1" onClick={() => setMobileOpen(false)}>Reviews</Link>
            <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
              <Link href="/login" className="text-slate-400 hover:text-white text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Sign in</Link>
              <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold px-5 py-3 rounded-xl text-center" onClick={() => setMobileOpen(false)}>
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero with real party image slideshow ─────────────────────────────────────

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1600&q=80",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&q=80",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1600&q=80",
  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1600&q=80",
  "https://images.unsplash.com/photo-1496337589254-7e19d01cec44?w=1600&q=80",
];

function Hero() {
  const [images, setImages] = useState<string[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [count, setCount] = useState({ users: 0, events: 0, communities: 0 });

  // Load hero images from Firestore (admin-managed), fallback to Unsplash
  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, "heroImages"), orderBy("order", "asc"), limit(8));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setImages(snap.docs.map((d) => d.data().url as string));
          setCaptions(snap.docs.map((d) => (d.data().caption as string) ?? ""));
        } else {
          setImages(FALLBACK_IMAGES);
          setCaptions(FALLBACK_IMAGES.map(() => ""));
        }
      } catch {
        setImages(FALLBACK_IMAGES);
        setCaptions(FALLBACK_IMAGES.map(() => ""));
      }
    };
    load();
  }, []);

  // Auto-advance slideshow
  useEffect(() => {
    if (!playing || images.length < 2) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % images.length), 4500);
    return () => clearInterval(t);
  }, [playing, images.length]);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

  // Counter animation
  useEffect(() => {
    const targets = { users: 2400000, events: 18000, communities: 5200 };
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / 2000, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setCount({ users: Math.floor(e * targets.users), events: Math.floor(e * targets.events), communities: Math.floor(e * targets.communities) });
      if (p < 1) requestAnimationFrame(tick);
    };
    const t = setTimeout(() => requestAnimationFrame(tick), 600);
    return () => clearTimeout(t);
  }, []);

  const fmt = (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(0)}K` : String(n);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050B18]">
      {/* ── Slideshow background ── */}
      <div className="absolute inset-0">
        {images.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === current ? 1 : 0 }}
          >
            <img
              src={src}
              alt={captions[i] || `Party ${i + 1}`}
              className="w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
        {/* Dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050B18]/70 via-[#050B18]/50 to-[#050B18]/90" />
        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-radial-gradient" style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(5,11,24,0.6) 100%)"
        }} />
      </div>

      {/* ── Slideshow controls ── */}
      {images.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white transition-all backdrop-blur-sm">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white transition-all backdrop-blur-sm">
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots + play/pause */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
            <button onClick={() => setPlaying(!playing)} className="text-white/60 hover:text-white transition-colors">
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all ${i === current ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/60"}`}
                />
              ))}
            </div>
            {captions[current] && (
              <span className="text-white/60 text-xs ml-2 max-w-xs truncate">{captions[current]}</span>
            )}
          </div>
        </>
      )}

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-24">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/90 text-sm font-medium">Now in public beta · Join 2.4M+ members</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight mb-6 drop-shadow-2xl">
          Where Every Party
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
            Finds Its Vibe
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow">
          Discover exclusive house parties, register in seconds, pay your ticket, and join the group chat with fellow attendees.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/signup" className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/30 hover:-translate-y-0.5 text-base">
            Join VibeCircle — Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/events" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-2xl transition-all text-base">
            Browse Events
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto">
          {[
            { label: "Members", value: fmt(count.users) },
            { label: "Events Hosted", value: `${fmt(count.events)}+` },
            { label: "Communities", value: `${fmt(count.communities)}+` },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow">{s.value}</div>
              <div className="text-white/50 text-xs sm:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const steps = [
  { step: "01", title: "Discover Parties", desc: "Browse exclusive house parties near you, filtered by vibe, date and price.", icon: Search, color: "from-blue-500 to-indigo-500" },
  { step: "02", title: "Register Free", desc: "Apply in one click. Registration is always free — no commitment yet.", icon: Users, color: "from-violet-500 to-purple-500" },
  { step: "03", title: "Pay Your Ticket", desc: "Once approved, pay within the 2-day window to secure your spot.", icon: Heart, color: "from-pink-500 to-rose-500" },
  { step: "04", title: "Join the Group Chat", desc: "All paid attendees get added to the private group chat automatically.", icon: MessageCircle, color: "from-blue-500 to-cyan-500" },
];

function HowItWorks() {
  return (
    <section className="bg-[#080F1E] py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">How It Works</div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">Simple. Fun. Trusted.</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">From discovery to dance floor in four steps.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          <div className="absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent hidden lg:block" />
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative text-center group">
                <div className="relative inline-flex mb-6">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} p-0.5 shadow-xl shadow-blue-900/30`}>
                    <div className="w-full h-full bg-[#080F1E] rounded-[14px] flex items-center justify-center">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#080F1E] border border-white/10 flex items-center justify-center">
                    <span className="text-slate-500 text-[10px] font-bold">{step.step}</span>
                  </div>
                </div>
                <h3 className="text-white font-semibold text-lg mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Trust & Safety ───────────────────────────────────────────────────────────

function TrustSafety() {
  return (
    <section className="bg-[#050B18] py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute left-0 bottom-0 w-[600px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-4">Trust & Safety</div>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight">Built for Safety.<br />Designed for Trust.</h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">Every member is verified. Every event is moderated. Your data is yours — never sold, never shared.</p>
            <div className="space-y-4">
              {[
                { icon: Shield, title: "Identity Verification", desc: "Multi-factor checks for all members" },
                { icon: Eye, title: "Event Moderation", desc: "Every event reviewed before going live" },
                { icon: Lock, title: "Private by Default", desc: "Your data is yours. Always." },
                { icon: Award, title: "Trusted Host Program", desc: "Verified hosts with track records" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 p-4 bg-white/[0.03] border border-white/8 rounded-xl hover:border-white/14 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm mb-0.5">{title}</div>
                    <div className="text-slate-400 text-sm">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-lg">Safety Score</div>
                  <div className="text-slate-400 text-sm">Platform-wide · Live</div>
                </div>
                <span className="ml-auto text-emerald-400 font-bold text-2xl">98.6%</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Verified Members", pct: 94, color: "bg-blue-500" },
                  { label: "Events Without Incidents", pct: 99, color: "bg-emerald-500" },
                  { label: "User Satisfaction", pct: 97, color: "bg-violet-500" },
                  { label: "Support Response Rate", pct: 100, color: "bg-cyan-500" },
                ].map((bar) => (
                  <div key={bar.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-400">{bar.label}</span>
                      <span className="text-white font-medium">{bar.pct}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${bar.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-white/8 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-400 text-sm">SOC 2 · GDPR · 256-bit Encryption</span>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30">✓ Verified Platform</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CTABanner() {
  return (
    <section className="bg-[#080F1E] py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 rounded-3xl p-12">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Find Your Vibe?</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of people discovering exclusive parties, making real connections, and creating unforgettable memories.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/25 hover:-translate-y-0.5 text-base inline-block">
              Create Free Account
            </Link>
            <Link href="/login" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-base inline-block">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#040912] border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Vibe<span className="text-blue-400">Circle</span></span>
          </Link>
          <div className="flex gap-6 text-slate-500 text-sm">
            <Link href="/events" className="hover:text-white transition-colors">Events</Link>
            <Link href="/people" className="hover:text-white transition-colors">People</Link>
            <Link href="/reviews" className="hover:text-white transition-colors">Reviews</Link>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
          </div>
          <p className="text-slate-600 text-sm">© {new Date().getFullYear()} VibeCircle</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <TrustSafety />
        <CTABanner />
      </main>
      <Footer />
    </>
  );
}
