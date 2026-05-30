"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/config";
import { getAllReviews } from "@/lib/firestore";
import type { Review } from "@/types";
import { Star, Zap, ArrowLeft, Quote } from "lucide-react";
import Link from "next/link";

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | "all">("all");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      const data = await getAllReviews(50);
      setReviews(data);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const filtered = filter === "all"
    ? reviews
    : reviews.filter((r) => r.rating === filter);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="min-h-screen bg-[#050B18] text-white">
      {/* Header */}
      <header className="border-b border-white/8 bg-[#080F1E]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">
              Vibe<span className="text-blue-400">Circle</span>
            </span>
          </Link>
          <Link href="/events" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Events
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="mb-10">
          <div className="text-amber-400 text-sm font-semibold uppercase tracking-widest mb-2">
            Community Reviews
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            What People Are Saying
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Real experiences from real attendees across all VibeCircle events.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-white/[0.03] border border-white/8 rounded-2xl h-44 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar — stats */}
            <div className="lg:col-span-1 space-y-5">
              {/* Overall rating */}
              <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 text-center">
                <div className="text-5xl font-bold text-white mb-1">
                  {avgRating ?? "—"}
                </div>
                <div className="flex justify-center gap-0.5 mb-2">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${
                      avgRating && s <= Math.round(Number(avgRating))
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-700"
                    }`} />
                  ))}
                </div>
                <p className="text-slate-500 text-xs">{reviews.length} reviews</p>
              </div>

              {/* Rating breakdown */}
              <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 space-y-2.5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  Filter by Stars
                </p>
                <button
                  onClick={() => setFilter("all")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                    filter === "all"
                      ? "bg-amber-400/10 border border-amber-400/20 text-amber-300"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>All reviews</span>
                  <span>{reviews.length}</span>
                </button>
                {ratingCounts.map(({ star, count }) => (
                  <button
                    key={star}
                    onClick={() => setFilter(star)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all ${
                      filter === star
                        ? "bg-amber-400/10 border border-amber-400/20 text-amber-300"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex gap-0.5 flex-1">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= star ? "fill-amber-400 text-amber-400" : "text-slate-700"}`} />
                      ))}
                    </div>
                    <span>{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reviews grid */}
            <div className="lg:col-span-3">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <div className="text-4xl mb-3">⭐</div>
                  <p>No reviews with {filter} stars yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filtered.map((review) => (
                    <GlobalReviewCard key={review.id} review={review} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GlobalReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white/[0.03] border border-white/8 hover:border-white/14 rounded-2xl p-5 transition-all flex flex-col gap-3">
      {/* Stars */}
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map((s) => (
          <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-700"}`} />
        ))}
      </div>

      {/* Quote */}
      <div className="relative">
        <Quote className="w-4 h-4 text-slate-700 absolute -top-1 -left-1" />
        <p className="text-slate-300 text-sm leading-relaxed pl-4 line-clamp-4">
          {review.content}
        </p>
      </div>

      {/* Event link */}
      <Link
        href={`/events/${review.eventId}`}
        className="text-xs text-blue-400 hover:text-blue-300 transition-colors truncate"
      >
        🎉 {review.eventTitle}
      </Link>

      {/* Author */}
      <div className="flex items-center gap-2.5 pt-2 border-t border-white/6">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
          {review.userName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-white text-xs font-semibold">{review.userName}</p>
          <p className="text-slate-600 text-xs">
            {new Date(review.createdAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
