"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle, Play } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatItem {
  label: string;
  value: string;
}

interface CounterTargets {
  users: number;
  events: number;
  communities: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TRUST_BADGES = [
  "SOC 2 Certified",
  "GDPR Compliant",
  "256-bit Encryption",
  "99.9% Uptime",
] as const;

const COUNTER_TARGETS: CounterTargets = {
  users: 2_400_000,
  events: 18_000,
  communities: 5_200,
};

const COUNTER_DURATION_MS = 2_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export function Hero() {
  const [count, setCount] = useState<CounterTargets>({ users: 0, events: 0, communities: 0 });

  // Animate counters on mount
  useEffect(() => {
    const start = Date.now();

    const tick = () => {
      const elapsed  = Date.now() - start;
      const progress = Math.min(elapsed / COUNTER_DURATION_MS, 1);
      const ease     = easeOutCubic(progress);

      setCount({
        users:       Math.floor(ease * COUNTER_TARGETS.users),
        events:      Math.floor(ease * COUNTER_TARGETS.events),
        communities: Math.floor(ease * COUNTER_TARGETS.communities),
      });

      if (progress < 1) requestAnimationFrame(tick);
    };

    const timer = setTimeout(() => requestAnimationFrame(tick), 600);
    return () => clearTimeout(timer);
  }, []);

  const stats: StatItem[] = [
    { label: "Members",       value: formatCount(count.users) },
    { label: "Events Hosted", value: `${formatCount(count.events)}+` },
    { label: "Communities",   value: `${formatCount(count.communities)}+` },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050B18]">
      {/* ── Background effects ── */}
      <HeroBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">

        {/* ── Eyebrow pill ── */}
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 text-sm font-medium">
            Now in public beta · Join 2.4M+ professionals
          </span>
        </div>

        {/* ── Headline ── */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight mb-6">
          Where Professionals
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Find Their Circle
          </span>
        </h1>

        {/* ── Sub-headline ── */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Join curated professional communities, attend exclusive events, and build
          the relationships that accelerate your career — all in one trusted space.
        </p>

        {/* ── CTAs ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-200 shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 text-base">
            Start Building Your Network
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-200 text-base">
            <Play className="w-4 h-4 text-blue-400" />
            Watch How It Works
          </button>
        </div>

        {/* ── Animated stats ── */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto mb-12">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-slate-500 text-xs sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Trust badges ── */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600 text-xs">
          {TRUST_BADGES.map((badge) => (
            <div key={badge} className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500/70" />
              <span>{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Background decoration ────────────────────────────────────────────────────

function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-600/8 rounded-full blur-[80px]" />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(100,149,237,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(100,149,237,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}