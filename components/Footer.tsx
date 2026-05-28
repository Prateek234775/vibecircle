import { Globe, Zap } from "lucide-react";
import { footerColumns } from "@/data";
import type { FooterColumn } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const SOCIAL_ICONS = ["𝕏", "in", "▶"] as const;

// ─── Footer ───────────────────────────────────────────────────────────────────

export function Footer() {
  return (
    <footer className="bg-[#040912] border-t border-white/5 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Main grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">

          {/* Brand column */}
          <div className="col-span-2">
            <FooterLogo />
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-6">
              The professional community platform where authentic relationships are
              built. Trusted by 2.4M+ members worldwide.
            </p>
            <SocialIcons />
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <FooterLinkColumn key={col.label} column={col} />
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-sm">
            © {new Date().getFullYear()} VibeCircle, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-600 text-sm">
              <Globe className="w-3.5 h-3.5" aria-hidden />
              English (US)
            </span>
            <span className="text-slate-600 text-sm">Made with ♥ for professionals</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FooterLogo() {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
        <Zap className="w-4 h-4 text-white" aria-hidden />
      </div>
      <span className="text-white font-bold text-xl tracking-tight">
        Vibe<span className="text-blue-400">Circle</span>
      </span>
    </div>
  );
}

function SocialIcons() {
  return (
    <div className="flex gap-3">
      {SOCIAL_ICONS.map((icon) => (
        <button
          key={icon}
          aria-label={`Follow us on ${icon}`}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/16 text-slate-400 hover:text-white text-sm transition-all"
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

function FooterLinkColumn({ column }: { column: FooterColumn }) {
  return (
    <div>
      <h3 className="text-white font-semibold text-sm mb-4">{column.label}</h3>
      <ul className="space-y-2.5">
        {column.items.map((item) => (
          <li key={item}>
            <a
              href="#"
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              {item}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}