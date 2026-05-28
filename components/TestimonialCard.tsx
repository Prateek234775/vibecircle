import { Star } from "lucide-react";
import type { Testimonial } from "@/types";

// ─── TestimonialCard ──────────────────────────────────────────────────────────

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const { name, role, company, content, rating, avatar } = testimonial;

  return (
    <figure className="bg-white/[0.03] border border-white/8 hover:border-white/14 rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/10 group flex flex-col">

      {/* ── Star rating ── */}
      <div className="flex gap-0.5 mb-5" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden />
        ))}
      </div>

      {/* ── Quote ── */}
      <blockquote className="text-slate-300 text-[15px] leading-relaxed mb-6 italic flex-1">
        &ldquo;{content}&rdquo;
      </blockquote>

      {/* ── Author ── */}
      <figcaption className="flex items-center gap-3 pt-5 border-t border-white/8">
        <Avatar initials={avatar} />
        <div>
          <p className="text-white font-semibold text-sm">{name}</p>
          <p className="text-slate-500 text-xs">
            {role} · {company}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}

// ─── Avatar sub-component ─────────────────────────────────────────────────────

function Avatar({ initials }: { initials: string }) {
  return (
    <div
      aria-hidden
      className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0"
    >
      <span className="text-white font-bold text-sm">{initials}</span>
    </div>
  );
}