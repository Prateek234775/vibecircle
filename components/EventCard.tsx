import { Calendar, MapPin, Users } from "lucide-react";
import  Badge  from "@/components/Badge";
import type { BadgeVariant, Event } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_VARIANT: Record<string, BadgeVariant> = {
  Technology: "default",
  Networking: "purple",
  Wellness:   "success",
};

// ─── EventCard ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: Event;
  /** Optional click handler — e.g. open detail modal */
  onRsvp?: (id: number) => void;
}

export function EventCard({ event, onRsvp }: EventCardProps) {
  const categoryVariant = CATEGORY_VARIANT[event.category] ?? "default";

  return (
    <article className="group bg-white/[0.03] border border-white/8 hover:border-white/16 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/20 cursor-pointer">

      {/* ── Image / colour band ── */}
      <div className={`relative h-44 ${event.image} flex items-end p-5`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Optional top badge (e.g. "Featured", "Sold Out Soon") */}
        {event.badge && (
          <div className="absolute top-4 right-4">
            <Badge variant={event.badge === "Featured" ? "purple" : "warning"}>
              {event.badge}
            </Badge>
          </div>
        )}

        {/* Category badge — bottom-left */}
        <Badge variant={categoryVariant}>{event.category}</Badge>
      </div>

      {/* ── Body ── */}
      <div className="p-5">
        <h3 className="text-white font-semibold text-base leading-snug mb-1 group-hover:text-blue-300 transition-colors">
          {event.title}
        </h3>
        <p className="text-slate-500 text-sm mb-4">{event.community}</p>

        <ul className="space-y-2 mb-5">
          <li className="flex items-center gap-2 text-slate-400 text-sm">
            <Calendar className="w-3.5 h-3.5 text-blue-400/70 flex-shrink-0" aria-hidden />
            {event.date} · {event.time}
          </li>
          <li className="flex items-center gap-2 text-slate-400 text-sm">
            <MapPin className="w-3.5 h-3.5 text-blue-400/70 flex-shrink-0" aria-hidden />
            {event.location}
          </li>
          <li className="flex items-center gap-2 text-slate-400 text-sm">
            <Users className="w-3.5 h-3.5 text-blue-400/70 flex-shrink-0" aria-hidden />
            {event.attendees.toLocaleString()} attending
          </li>
        </ul>

        <button
          onClick={() => onRsvp?.(Number(event.id))}
          className="w-full bg-white/5 hover:bg-blue-600/20 border border-white/8 hover:border-blue-500/30 text-white text-sm font-medium py-2.5 rounded-xl transition-all duration-200"
        >
          RSVP Now
        </button>
      </div>
    </article>
  );
}