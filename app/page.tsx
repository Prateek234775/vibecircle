"use client";

import { useEffect, useRef, useState } from "react";
import {
  Users,
  Calendar,
  Shield,
  Star,
  ArrowRight,
  CheckCircle,
  MapPin,
  Clock,
  ChevronRight,
  Play,
  Zap,
  Globe,
  Heart,
  MessageCircle,
  Bell,
  Search,
  Menu,
  X,
  Download,
  Apple,
  Smartphone,
  TrendingUp,
  Lock,
  Eye,
  Award,
  Sparkles,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Event {
  id: number;
  title: string;
  community: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  category: string;
  image: string;
  badge?: string;
}

interface Community {
  id: number;
  name: string;
  members: number;
  category: string;
  description: string;
  gradient: string;
  icon: string;
  growth: string;
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const events: Event[] = [
  {
    id: 1,
    title: "Future of AI in Product Design",
    community: "Design Leaders Guild",
    date: "Jun 14, 2025",
    time: "6:00 PM",
    location: "San Francisco, CA",
    attendees: 342,
    category: "Technology",
    image: "bg-gradient-to-br from-blue-900 to-indigo-900",
    badge: "Sold Out Soon",
  },
  {
    id: 2,
    title: "Startup Founders Mixer — Q3 Edition",
    community: "VC Connect Network",
    date: "Jun 18, 2025",
    time: "7:30 PM",
    location: "New York, NY",
    attendees: 189,
    category: "Networking",
    image: "bg-gradient-to-br from-violet-900 to-purple-900",
    badge: "Featured",
  },
  {
    id: 3,
    title: "Mindfulness & Leadership Retreat",
    community: "Exec Wellness Circle",
    date: "Jun 22, 2025",
    time: "9:00 AM",
    location: "Austin, TX",
    attendees: 74,
    category: "Wellness",
    image: "bg-gradient-to-br from-slate-800 to-blue-900",
  },
];

const communities: Community[] = [
  {
    id: 1,
    name: "Design Leaders Guild",
    members: 12400,
    category: "Design & UX",
    description:
      "Senior designers and creative directors shaping the future of digital experiences.",
    gradient: "from-blue-600/20 to-indigo-600/20",
    icon: "🎨",
    growth: "+18%",
  },
  {
    id: 2,
    name: "VC Connect Network",
    members: 8900,
    category: "Venture Capital",
    description:
      "Founders, angels, and VCs building the next generation of transformative companies.",
    gradient: "from-violet-600/20 to-purple-600/20",
    icon: "💼",
    growth: "+34%",
  },
  {
    id: 3,
    name: "Climate Tech Alliance",
    members: 21000,
    category: "Climate",
    description:
      "Engineers, scientists, and policymakers accelerating the clean energy transition.",
    gradient: "from-emerald-600/20 to-teal-600/20",
    icon: "🌍",
    growth: "+52%",
  },
  {
    id: 4,
    name: "Global Dev Collective",
    members: 34500,
    category: "Engineering",
    description:
      "Full-stack engineers sharing knowledge, tools, and opportunities worldwide.",
    gradient: "from-cyan-600/20 to-blue-600/20",
    icon: "⚡",
    growth: "+27%",
  },
];

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Head of Product",
    company: "Notion",
    content:
      "VibeCircle completely changed how our design team connects with the broader community. The events we've hosted have led to three incredible hires and partnerships we never expected.",
    rating: 5,
    avatar: "SC",
  },
  {
    id: 2,
    name: "Marcus Williams",
    role: "General Partner",
    company: "Sequoia Capital",
    content:
      "I've attended over 40 events on VibeCircle in the past year. The quality of people, the curation of communities — it's unlike anything else. This is where real connections happen.",
    rating: 5,
    avatar: "MW",
  },
  {
    id: 3,
    name: "Priya Sharma",
    role: "Founder & CEO",
    company: "Luma AI",
    content:
      "From a cold founder with no network to closing a $4M seed round — VibeCircle communities were the catalyst. Authentic, professional, and genuinely transformative.",
    rating: 5,
    avatar: "PS",
  },
];

const steps = [
  {
    step: "01",
    title: "Discover Your Tribe",
    description:
      "Our AI surfaces communities and events perfectly matched to your professional goals, interests, and location.",
    icon: Search,
    color: "from-blue-500 to-indigo-500",
  },
  {
    step: "02",
    title: "Join & Engage",
    description:
      "Request membership, attend events, spark conversations. Every interaction is purposeful and meaningful.",
    icon: Users,
    color: "from-violet-500 to-purple-500",
  },
  {
    step: "03",
    title: "Build Real Relationships",
    description:
      "Move beyond followers. Cultivate genuine professional relationships that open doors and create opportunities.",
    icon: Heart,
    color: "from-indigo-500 to-blue-500",
  },
  {
    step: "04",
    title: "Grow Together",
    description:
      "Host your own events, grow your community, and establish your place as a leader in your field.",
    icon: TrendingUp,
    color: "from-blue-500 to-cyan-500",
  },
];

// ─── Utility Components ───────────────────────────────────────────────────────

const Badge = ({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "purple";
}) => {
  const variants = {
    default:
      "bg-blue-500/10 text-blue-400 border-blue-500/20",
    success:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning:
      "bg-amber-500/10 text-amber-400 border-amber-500/20",
    purple:
      "bg-violet-500/10 text-violet-400 border-violet-500/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]}`}
    >
      {children}
    </span>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
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
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              Vibe<span className="text-blue-400">Circle</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {["Communities", "Events", "Discover", "Pricing"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-slate-400 hover:text-white text-sm font-medium transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <button className="text-slate-400 hover:text-white text-sm font-medium transition-colors px-4 py-2">
              Sign in
            </button>
            <button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5">
              Get Started Free
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-slate-400 hover:text-white p-2"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#050B18]/98 backdrop-blur-xl border-b border-white/5 px-4 pb-6 pt-2">
          <div className="flex flex-col gap-4">
            {["Communities", "Events", "Discover", "Pricing"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-slate-400 hover:text-white text-base font-medium transition-colors py-1"
              >
                {item}
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
};

// ─── Hero ─────────────────────────────────────────────────────────────────────

const Hero = () => {
  const [count, setCount] = useState({ users: 0, events: 0, communities: 0 });

  useEffect(() => {
    const targets = { users: 2400000, events: 18000, communities: 5200 };
    const duration = 2000;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      setCount({
        users: Math.floor(ease * targets.users),
        events: Math.floor(ease * targets.events),
        communities: Math.floor(ease * targets.communities),
      });

      if (progress < 1) requestAnimationFrame(tick);
    };

    const timer = setTimeout(() => requestAnimationFrame(tick), 600);
    return () => clearTimeout(timer);
  }, []);

  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050B18]">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-600/8 rounded-full blur-[80px]" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(100,149,237,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(100,149,237,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 text-sm font-medium">
            Now in public beta · Join 2.4M+ professionals
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight mb-6">
          Where Professionals
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Find Their Circle
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Join curated professional communities, attend exclusive events, and build
          the relationships that accelerate your career — all in one trusted space.
        </p>

        {/* CTAs */}
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto">
          {[
            { label: "Members", value: formatNum(count.users) },
            { label: "Events Hosted", value: formatNum(count.events) + "+" },
            { label: "Communities", value: formatNum(count.communities) + "+" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-slate-500 text-xs sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-slate-600 text-xs">
          {["SOC 2 Certified", "GDPR Compliant", "256-bit Encryption", "99.9% Uptime"].map(
            (item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500/70" />
                <span>{item}</span>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
};

// ─── Events ───────────────────────────────────────────────────────────────────

const EventsSection = () => {
  const categoryColors: Record<string, string> = {
    Technology: "default",
    Networking: "purple",
    Wellness: "success",
  };

  return (
    <section className="bg-[#080F1E] py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div>
            <div className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">
              Upcoming Events
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Experiences Worth
              <br />
              Showing Up For
            </h2>
          </div>
          <button className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors group self-start sm:self-auto">
            View all events
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <div
              key={event.id}
              className="group bg-white/[0.03] border border-white/8 hover:border-white/16 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/20 cursor-pointer"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Image area */}
              <div className={`relative h-44 ${event.image} flex items-end p-5`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {event.badge && (
                  <div className="absolute top-4 right-4">
                    <Badge variant={event.badge === "Featured" ? "purple" : "warning"}>
                      {event.badge}
                    </Badge>
                  </div>
                )}
                <Badge variant={categoryColors[event.category] as "default" | "success" | "warning" | "purple" ?? "default"}>
                  {event.category}
                </Badge>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-white font-semibold text-base leading-snug mb-1 group-hover:text-blue-300 transition-colors">
                  {event.title}
                </h3>
                <p className="text-slate-500 text-sm mb-4">{event.community}</p>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Calendar className="w-3.5 h-3.5 text-blue-400/70 flex-shrink-0" />
                    {event.date} · {event.time}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <MapPin className="w-3.5 h-3.5 text-blue-400/70 flex-shrink-0" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Users className="w-3.5 h-3.5 text-blue-400/70 flex-shrink-0" />
                    {event.attendees.toLocaleString()} attending
                  </div>
                </div>

                <button className="w-full bg-white/5 hover:bg-blue-600/20 border border-white/8 hover:border-blue-500/30 text-white text-sm font-medium py-2.5 rounded-xl transition-all duration-200">
                  RSVP Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Communities ──────────────────────────────────────────────────────────────

const CommunitiesSection = () => (
  <section className="bg-[#050B18] py-24 lg:py-32 relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute right-0 top-0 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[100px]" />
    </div>

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
        <div>
          <div className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Trending Communities
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Your People
            <br />
            Are Already Here
          </h2>
        </div>
        <button className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors group self-start sm:self-auto">
          Explore all communities
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {communities.map((community, i) => (
          <div
            key={community.id}
            className={`group relative bg-gradient-to-br ${community.gradient} border border-white/8 hover:border-white/16 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer overflow-hidden`}
          >
            <div className="absolute inset-0 bg-[#050B18]/60" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{community.icon}</span>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-400/10 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  {community.growth}
                </div>
              </div>
              <h3 className="text-white font-semibold text-base mb-1 leading-snug group-hover:text-blue-300 transition-colors">
                {community.name}
              </h3>
              <p className="text-slate-500 text-xs mb-3">{community.category}</p>
              <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">
                {community.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <Users className="w-3.5 h-3.5" />
                  {(community.members / 1000).toFixed(1)}K members
                </div>
                <button className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors flex items-center gap-1">
                  Join
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── How It Works ─────────────────────────────────────────────────────────────

const HowItWorks = () => (
  <section className="bg-[#080F1E] py-24 lg:py-32">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <div className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">
          How It Works
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
          Simple. Purposeful. Powerful.
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-lg">
          Four steps to your most valuable professional network.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
        {/* Connecting line (desktop) */}
        <div className="absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent hidden lg:block" />

        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.step} className="relative text-center group">
              {/* Number */}
              <div className="relative inline-flex mb-6">
                <div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} p-0.5 shadow-xl shadow-blue-900/30`}
                >
                  <div className="w-full h-full bg-[#080F1E] rounded-[14px] flex items-center justify-center">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#080F1E] border border-white/10 flex items-center justify-center">
                  <span className="text-slate-500 text-[10px] font-bold">{step.step}</span>
                </div>
              </div>
              <h3 className="text-white font-semibold text-lg mb-3">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

// ─── Trust & Safety ───────────────────────────────────────────────────────────

const TrustSafety = () => (
  <section className="bg-[#050B18] py-24 lg:py-32 relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute left-0 bottom-0 w-[600px] h-[400px] bg-blue-600/5 rounded-full blur-[120px]" />
    </div>

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-4">
            Trust & Safety
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Built for Safety.
            <br />
            Designed for Trust.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Every member is verified. Every community is moderated. We've built
            enterprise-grade infrastructure so you can focus on what matters —
            building genuine relationships in a safe, professional environment.
          </p>

          <div className="space-y-4">
            {[
              {
                icon: Shield,
                title: "Identity Verification",
                desc: "Multi-factor identity checks for all members",
              },
              {
                icon: Eye,
                title: "Community Moderation",
                desc: "AI + human moderators active 24/7",
              },
              {
                icon: Lock,
                title: "Private by Default",
                desc: "Your data is yours. Never sold, never shared.",
              },
              {
                icon: Award,
                title: "Trusted Host Program",
                desc: "Certified event organizers with verified track records",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-start gap-4 p-4 bg-white/[0.03] border border-white/8 rounded-xl hover:border-white/14 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm mb-0.5">
                      {item.title}
                    </div>
                    <div className="text-slate-400 text-sm">{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual */}
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
              <div className="ml-auto">
                <span className="text-emerald-400 font-bold text-2xl">98.6%</span>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: "Identity Verified Members", pct: 94, color: "bg-blue-500" },
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
                    <div
                      className={`h-full ${bar.color} rounded-full`}
                      style={{ width: `${bar.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/8 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-slate-400 text-sm">
                SOC 2 Type II · ISO 27001 · GDPR · CCPA Compliant
              </span>
            </div>
          </div>

          {/* Floating badge */}
          <div className="absolute -top-4 -right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30">
            ✓ Verified Platform
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Testimonials ─────────────────────────────────────────────────────────────

const Testimonials = () => (
  <section className="bg-[#080F1E] py-24 lg:py-32">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <div className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">
          Testimonials
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
          Loved by Professionals
          <br />
          Worldwide
        </h2>
        <div className="flex items-center justify-center gap-1 mt-2">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          <span className="text-slate-400 text-sm ml-2">4.9/5 from 12,000+ reviews</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <div
            key={t.id}
            className="bg-white/[0.03] border border-white/8 hover:border-white/14 rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/10 group"
          >
            <div className="flex gap-0.5 mb-5">
              {Array(t.rating)
                .fill(0)
                .map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
            </div>
            <p className="text-slate-300 text-[15px] leading-relaxed mb-6 italic">
              "{t.content}"
            </p>
            <div className="flex items-center gap-3 pt-5 border-t border-white/8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{t.avatar}</span>
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{t.name}</div>
                <div className="text-slate-500 text-xs">
                  {t.role} · {t.company}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Download CTA ─────────────────────────────────────────────────────────────

const DownloadCTA = () => (
  <section className="bg-[#050B18] py-24 lg:py-32 relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-blue-600/8 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-violet-600/8 rounded-full blur-[80px]" />
    </div>

    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <span className="text-slate-300 text-sm font-medium">
          Available on iOS & Android
        </span>
      </div>

      <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
        Your Circle Is
        <br />
        <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
          Waiting for You
        </span>
      </h2>
      <p className="text-slate-400 text-xl mb-12 max-w-xl mx-auto leading-relaxed">
        Download VibeCircle and start building meaningful professional relationships
        today. Free forever. Upgrade when you're ready.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button className="group flex items-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold px-7 py-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 shadow-2xl shadow-white/10 text-base w-full sm:w-auto justify-center">
          <Apple className="w-5 h-5" />
          <div className="text-left">
            <div className="text-xs text-slate-500 font-normal leading-none mb-0.5">
              Download on the
            </div>
            <div className="text-sm font-bold leading-none">App Store</div>
          </div>
        </button>
        <button className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold px-7 py-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 text-base w-full sm:w-auto justify-center">
          <Smartphone className="w-5 h-5 text-blue-400" />
          <div className="text-left">
            <div className="text-xs text-slate-500 font-normal leading-none mb-0.5">
              Get it on
            </div>
            <div className="text-sm font-bold leading-none">Google Play</div>
          </div>
        </button>
      </div>

      <p className="text-slate-600 text-sm mt-8">
        No credit card required · 5-minute setup · Cancel anytime
      </p>
    </div>
  </section>
);

// ─── Footer ───────────────────────────────────────────────────────────────────

const Footer = () => (
  <footer className="bg-[#040912] border-t border-white/5 py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
        {/* Brand */}
        <div className="col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-xl">
              Vibe<span className="text-blue-400">Circle</span>
            </span>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-6">
            The professional community platform where authentic relationships are
            built. Trusted by 2.4M+ members worldwide.
          </p>
          <div className="flex gap-3">
            {["𝕏", "in", "▶"].map((icon, i) => (
              <button
                key={i}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/16 text-slate-400 hover:text-white text-sm transition-all"
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Links */}
        {[
          {
            label: "Product",
            items: ["Communities", "Events", "Discover", "Premium", "Mobile App"],
          },
          {
            label: "Company",
            items: ["About", "Blog", "Careers", "Press", "Contact"],
          },
          {
            label: "Legal",
            items: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Security"],
          },
        ].map((col) => (
          <div key={col.label}>
            <div className="text-white font-semibold text-sm mb-4">{col.label}</div>
            <ul className="space-y-2.5">
              {col.items.map((item) => (
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
        ))}
      </div>

      {/* Bottom */}
      <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-slate-600 text-sm">
          © 2025 VibeCircle, Inc. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-slate-600 text-sm">
            <Globe className="w-3.5 h-3.5" />
            English (US)
          </span>
          <span className="text-slate-600 text-sm">Made with ♥ for professionals</span>
        </div>
      </div>
    </div>
  </footer>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="min-h-screen" style={{ fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}>
      <Navbar />
      <Hero />
      <EventsSection />
      <CommunitiesSection />
      <HowItWorks />
      <TrustSafety />
      <Testimonials />
      <DownloadCTA />
      <Footer />
    </main>
  );
}