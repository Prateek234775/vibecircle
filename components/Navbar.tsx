"use client";

import { useEffect, useState } from "react";
import { Menu, X, Zap } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_LINKS = ["Communities", "Events", "Discover", "Pricing"] as const;

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#050B18]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* ── Logo ── */}
          <Logo />

          {/* ── Desktop nav links ── */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href="#"
                className="text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200"
              >
                {link}
              </a>
            ))}
          </div>

          {/* ── Desktop CTA ── */}
          <div className="hidden lg:flex items-center gap-3">
            <button className="text-slate-400 hover:text-white text-sm font-medium transition-colors px-4 py-2">
              Sign in
            </button>
            <button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5">
              Get Started Free
            </button>
          </div>

          {/* ── Mobile toggle ── */}
          <button
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden text-slate-400 hover:text-white p-2 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#050B18]/98 backdrop-blur-xl border-b border-white/5 px-4 pb-6 pt-2">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href="#"
                className="text-slate-400 hover:text-white text-base font-medium transition-colors py-1"
              >
                {link}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
              <button className="text-slate-400 hover:text-white text-sm font-medium transition-colors py-2 text-left">
                Sign in
              </button>
              <button className="bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold px-5 py-3 rounded-xl">
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Logo sub-component ───────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
        <Zap className="w-4 h-4 text-white" />
      </div>
      <span className="text-white font-bold text-xl tracking-tight">
        Vibe<span className="text-blue-400">Circle</span>
      </span>
    </div>
  );
}