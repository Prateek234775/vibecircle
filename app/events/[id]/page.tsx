"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/config";
import {
  getEvent,
  getRegistration,
  registerForEvent,
  getEventReviews,
  submitReview,
  getUserProfile,
  getEventQuestions,
  postQuestion,
  postAnswer,
  isAdmin,
} from "@/lib/firestore";
import type { PartyEvent, Registration, Review, Question } from "@/types";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  IndianRupee,
  Star,
  MessageCircle,
  CheckCircle,
  ArrowLeft,
  Zap,
  AlertCircle,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeLeft(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<PartyEvent | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [uid, setUid] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);

  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Q&A form
  const [questionText, setQuestionText] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [answerTexts, setAnswerTexts] = useState<Record<string, string>>({});
  const [submittingAnswer, setSubmittingAnswer] = useState<string | null>(null);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  // Simulated payment state (Razorpay integration point)
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUid(user.uid);
      setUserEmail(user.email ?? "");

      const profile = await getUserProfile(user.uid);
      setUserName(profile?.name ?? user.displayName ?? "User");
      setUserPhoto(profile?.photoURL ?? user.photoURL ?? "");
      setAadhaarVerified(profile?.aadhaarVerified === true);

      const [ev, reg, revs, qs, adminCheck] = await Promise.all([
        getEvent(id),
        getRegistration(id, user.uid),
        getEventReviews(id),
        getEventQuestions(id),
        isAdmin(user.uid),
      ]);

      setEvent(ev);
      setRegistration(reg);
      setReviews(revs);
      setQuestions(qs);
      setUserIsAdmin(adminCheck);

      // Send 24h reminder notification if party is tomorrow and user is paid
      if (ev && reg?.status === "paid") {
        const partyTime = new Date(ev.date).getTime();
        const hoursUntil = (partyTime - Date.now()) / 3600000;
        if (hoursUntil > 0 && hoursUntil <= 25) {
          const { createNotification } = await import("@/lib/firestore");
          await createNotification(
            user.uid,
            "party_reminder",
            "Party starts in 24 hours! 🎉",
            `"${ev.title}" is tomorrow at ${ev.time} in ${ev.location}. Get ready!`,
            ev.id,
            ev.title
          ).catch(() => {}); // silent — may already exist
        }
      }

      setLoading(false);
    });
    return () => unsub();
  }, [id, router]);

  const handleRegister = async () => {
    if (!uid || !event) return;
    setRegistering(true);
    setRegError("");
    try {
      await registerForEvent(event.id, uid, userName, userEmail, userPhoto);
      const reg = await getRegistration(event.id, uid);
      setRegistration(reg);
      setRegSuccess(true);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setRegistering(false);
    }
  };

  // Razorpay payment handler
  const handlePayment = async () => {
    if (!event || !registration) return;
    setPaying(true);

    // Load Razorpay script dynamically
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
        amount: event.ticketPrice * 100, // paise
        currency: "INR",
        name: "VibeCircle",
        description: event.title,
        handler: async (response: { razorpay_payment_id: string }) => {
          // Mark registration as paid
          const { updateRegistrationStatus, createNotification } = await import("@/lib/firestore");
          await updateRegistrationStatus(registration.id, "paid", {
            paymentId: response.razorpay_payment_id,
            paidAt: new Date().toISOString(),
          });
          // Notify user — booking confirmed
          await createNotification(
            uid!,
            "booking_confirmed",
            "Booking Confirmed! 🎉",
            `Your ticket for "${event.title}" is confirmed. See you at the party!`,
            event.id,
            event.title
          );
          // Notify host — new booking
          if (event.isUserEvent && event.createdBy !== uid) {
            await createNotification(
              event.createdBy,
              "new_booking",
              "New Booking Received 🎟️",
              `${userName} just paid for a ticket to "${event.title}".`,
              event.id,
              event.title
            );
          }
          setRegistration((prev) =>
            prev ? { ...prev, status: "paid", paymentId: response.razorpay_payment_id } : prev
          );
          setPaying(false);
        },
        prefill: { name: userName, email: userEmail },
        theme: { color: "#6366f1" },
        modal: { ondismiss: () => setPaying(false) },
      };
      // @ts-expect-error Razorpay is loaded via script
      const rzp = new window.Razorpay(options);
      rzp.open();
    };
    script.onerror = () => {
      setRegError("Payment gateway failed to load. Please try again.");
      setPaying(false);
    };
    document.body.appendChild(script);
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !event || !reviewText.trim()) return;
    setSubmittingReview(true);
    setReviewError("");
    try {
      await submitReview(event.id, event.title, uid, userName, reviewRating, reviewText, userPhoto);
      const updated = await getEventReviews(event.id);
      setReviews(updated);
      setReviewText("");
      setReviewSuccess(true);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handlePostQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !event || !questionText.trim()) return;
    setSubmittingQuestion(true);
    try {
      await postQuestion(event.id, uid, userName, questionText, userPhoto);
      const updated = await getEventQuestions(event.id);
      setQuestions(updated);
      setQuestionText("");
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handlePostAnswer = async (questionId: string) => {
    const text = answerTexts[questionId];
    if (!uid || !event || !text?.trim()) return;
    setSubmittingAnswer(questionId);
    const isHost = userIsAdmin || event.createdBy === uid;
    try {
      await postAnswer(questionId, uid, userName, text, isHost, userPhoto);
      const updated = await getEventQuestions(event.id);
      setQuestions(updated);
      setAnswerTexts((prev) => ({ ...prev, [questionId]: "" }));
    } finally {
      setSubmittingAnswer(null);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!event) return <NotFound />;

  const isRegistrationOpen = event.status === "registration_open";
  const isPaymentOpen = event.status === "payment_open";
  const isCompleted = event.status === "completed";
  const isPaid = registration?.status === "paid";
  const isApproved = registration?.status === "approved";
  const canChat = isPaid;
  const canReview = isCompleted && isPaid;
  const isHost = userIsAdmin || event.createdBy === uid;
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="min-h-screen bg-[#050B18] text-white">
      {/* ── Header ── */}
      <header className="border-b border-white/8 bg-[#080F1E]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">
              Vibe<span className="text-blue-400">Circle</span>
            </span>
          </Link>
          <Link
            href="/events"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Events
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cover */}
            <div className={`relative h-64 sm:h-80 rounded-2xl overflow-hidden ${event.coverImage.startsWith("http") ? "" : event.coverImage}`}>
              {event.coverImage.startsWith("http") && (
                <img src={event.coverImage} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-xs font-medium bg-white/10 border border-white/20 text-white px-2.5 py-1 rounded-full mb-3 inline-block">
                  {event.category}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  {event.title}
                </h1>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-3">About This Party</h2>
              <p className="text-slate-400 leading-relaxed">
                {event.description || "No description provided."}
              </p>
            </div>

            {/* Timeline */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Important Dates</h2>
              <div className="space-y-4">
                <TimelineItem
                  icon={<Calendar className="w-4 h-4" />}
                  label="Party Date"
                  value={`${fmtDate(event.date)} at ${event.time}`}
                  color="text-blue-400"
                />
                <TimelineItem
                  icon={<Clock className="w-4 h-4" />}
                  label="Registration Deadline"
                  value={`${fmtDateShort(event.registrationDeadline)} · ${timeLeft(event.registrationDeadline)}`}
                  color="text-emerald-400"
                />
                <TimelineItem
                  icon={<IndianRupee className="w-4 h-4" />}
                  label="Payment Deadline"
                  value={`${fmtDateShort(event.paymentDeadline)} · ${timeLeft(event.paymentDeadline)}`}
                  color="text-amber-400"
                />
                <TimelineItem
                  icon={<MessageCircle className="w-4 h-4" />}
                  label="Group Chat Opens"
                  value="After payment deadline — paid members only"
                  color="text-violet-400"
                />
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold">
                  Reviews {reviews.length > 0 && `(${reviews.length})`}
                </h2>
                {avgRating && (
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="font-bold">{avgRating}</span>
                    <span className="text-slate-500 text-sm">/ 5</span>
                  </div>
                )}
              </div>

              {/* Submit review */}
              {canReview && !reviewSuccess && (
                <form onSubmit={handleReview} className="mb-6 bg-white/[0.03] border border-white/8 rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-300 mb-3">Share your experience</p>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            s <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-600"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="How was the party? Tell others about your experience..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 resize-none mb-3 transition-all"
                  />
                  {reviewError && (
                    <p className="text-red-400 text-xs mb-3">{reviewError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={submittingReview || !reviewText.trim()}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              )}

              {reviewSuccess && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3 mb-4">
                  <CheckCircle className="w-4 h-4" />
                  Review submitted! Thanks for sharing.
                </div>
              )}

              {reviews.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">
                  No reviews yet. Be the first to share your experience!
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              )}
            </div>
            {/* Q&A Section */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold">
                  Questions & Answers
                </h2>
                {questions.length > 0 && (
                  <span className="text-xs text-slate-500 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
                    {questions.length}
                  </span>
                )}
              </div>

              {/* Ask a question */}
              <form onSubmit={handlePostQuestion} className="mb-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <textarea
                      rows={2}
                      placeholder="Ask anything about this event — venue, dress code, what to bring..."
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 resize-none transition-all mb-2"
                    />
                    <button
                      type="submit"
                      disabled={submittingQuestion || !questionText.trim()}
                      className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/20 disabled:opacity-40 text-blue-300 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submittingQuestion ? "Posting..." : "Post Question"}
                    </button>
                  </div>
                </div>
              </form>

              {/* Questions list */}
              {questions.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">
                  No questions yet. Be the first to ask!
                </p>
              ) : (
                <div className="space-y-4">
                  {questions.map((q) => (
                    <div key={q.id} className="bg-white/[0.02] border border-white/6 rounded-xl overflow-hidden">
                      {/* Question */}
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {q.userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white text-xs font-semibold">{q.userName}</span>
                              <span className="text-slate-600 text-xs">
                                {new Date(q.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </span>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed">{q.text}</p>
                          </div>
                          <button
                            onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                          >
                            {q.answers.length > 0 && (
                              <span className="text-blue-400">{q.answers.length} ans</span>
                            )}
                            {expandedQ === q.id
                              ? <ChevronUp className="w-3.5 h-3.5" />
                              : <ChevronDown className="w-3.5 h-3.5" />
                            }
                          </button>
                        </div>
                      </div>

                      {/* Answers */}
                      {(expandedQ === q.id || q.answers.length > 0) && (
                        <div className="border-t border-white/6 bg-white/[0.02]">
                          {q.answers.map((ans) => (
                            <div key={ans.id} className="flex items-start gap-3 px-4 py-3 border-b border-white/4 last:border-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                ans.isHost
                                  ? "bg-gradient-to-br from-amber-500 to-orange-500"
                                  : "bg-gradient-to-br from-slate-600 to-slate-700"
                              }`}>
                                {ans.userName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-white text-xs font-semibold">{ans.userName}</span>
                                  {ans.isHost && (
                                    <span className="flex items-center gap-1 text-amber-400 text-xs bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                                      <ShieldCheck className="w-3 h-3" />
                                      Host
                                    </span>
                                  )}
                                  <span className="text-slate-600 text-xs">
                                    {new Date(ans.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                  </span>
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed">{ans.text}</p>
                              </div>
                            </div>
                          ))}

                          {/* Answer input */}
                          <div className="flex gap-2 px-4 py-3">
                            <input
                              type="text"
                              placeholder={isHost ? "Answer as host..." : "Write an answer..."}
                              value={answerTexts[q.id] ?? ""}
                              onChange={(e) =>
                                setAnswerTexts((prev) => ({ ...prev, [q.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handlePostAnswer(q.id);
                                }
                              }}
                              className="flex-1 bg-white/[0.04] border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500/40 transition-all"
                            />
                            <button
                              onClick={() => handlePostAnswer(q.id)}
                              disabled={submittingAnswer === q.id || !answerTexts[q.id]?.trim()}
                              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all disabled:opacity-40 flex-shrink-0 ${
                                isHost
                                  ? "bg-amber-500/20 border border-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                                  : "bg-blue-600/20 border border-blue-500/20 text-blue-400 hover:bg-blue-600/30"
                              }`}
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
          <div className="space-y-5">
            {/* Event info card */}
            <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">₹{event.ticketPrice}</span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    {
                      registration_open: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
                      payment_open: "text-amber-400 bg-amber-400/10 border-amber-400/20",
                      upcoming: "text-blue-400 bg-blue-400/10 border-blue-400/20",
                      closed: "text-slate-400 bg-slate-400/10 border-slate-400/20",
                      completed: "text-violet-400 bg-violet-400/10 border-violet-400/20",
                    }[event.status] ?? "text-slate-400 bg-slate-400/10 border-slate-400/20"
                  }`}
                >
                  {event.status.replace("_", " ")}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2.5 text-slate-400">
                  <MapPin className="w-4 h-4 text-blue-400/70 flex-shrink-0" />
                  <div>
                    <p className="text-white">{event.location}</p>
                    {event.address && isPaid && <p className="text-slate-500 text-xs mt-0.5">{event.address}</p>}
                    {event.address && !isPaid && <p className="text-slate-600 text-xs mt-0.5">Full address shared after payment</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-slate-400">
                  <Users className="w-4 h-4 text-blue-400/70 flex-shrink-0" />
                  <div>
                    <span className={`font-semibold ${
                      event.maxAttendees - event.attendeeCount <= 5
                        ? "text-amber-400"
                        : "text-white"
                    }`}>
                      {event.maxAttendees - event.attendeeCount} slots available
                    </span>
                    <span className="text-slate-600 text-xs ml-1">of {event.maxAttendees}</span>
                  </div>
                </div>
                {/* Host info */}
                <div className="flex items-start gap-2.5 text-slate-400 pt-1 border-t border-white/6">
                  <div className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400/70">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Hosted by</p>
                    {event.isUserEvent ? (
                      <p className="text-violet-400 text-sm font-medium">{event.createdByName}</p>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                          <Zap className="w-2.5 h-2.5 text-white" />
                        </div>
                        <p className="text-blue-400 text-sm font-medium">VibeCircle</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Capacity bar */}
              <div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        (event.attendeeCount / event.maxAttendees) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  {event.maxAttendees - event.attendeeCount} of {event.maxAttendees} slots available
                </p>
              </div>

              {/* CTA */}
              {!registration && isRegistrationOpen && (
                <>
                  {/* Aadhaar verification gate */}
                  {!aadhaarVerified ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2.5 text-amber-400 text-xs bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-3">
                        <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold mb-0.5">Verification Required</p>
                          <p className="text-amber-400/80">Only Aadhaar-verified members can register for events.</p>
                        </div>
                      </div>
                      <Link
                        href="/verify"
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold py-3 rounded-xl transition-all text-sm"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Verify with Aadhaar
                      </Link>
                    </div>
                  ) : (
                    <>
                      {regError && (
                        <div className="flex items-start gap-2 text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2.5">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          {regError}
                        </div>
                      )}
                      <button
                        onClick={handleRegister}
                        disabled={registering}
                        className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all text-sm"
                      >
                        {registering ? "Registering..." : "Register Now — Free"}
                      </button>
                      <p className="text-xs text-slate-500 text-center">
                        Registration is free. Pay ₹{event.ticketPrice} after approval.
                      </p>
                    </>
                  )}
                </>
              )}

              {regSuccess && !registration && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-3">
                  <CheckCircle className="w-4 h-4" />
                  Registered! Awaiting admin approval.
                </div>
              )}

              {registration && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300">
                      You&apos;re registered —{" "}
                      <span className="font-semibold capitalize text-white">
                        {registration.status}
                      </span>
                    </span>
                  </div>

                  {/* Pay button — show when payment is open and user is approved but not yet paid */}
                  {isPaymentOpen && isApproved && !isPaid && (
                    <>
                      <button
                        onClick={handlePayment}
                        disabled={paying}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all text-sm"
                      >
                        {paying ? "Opening payment..." : `Pay ₹${event.ticketPrice} Now`}
                      </button>
                      <p className="text-xs text-amber-400/80 text-center">
                        Payment deadline: {fmtDateShort(event.paymentDeadline)}
                      </p>
                    </>
                  )}

                  {isPaid && (
                    <div className="flex items-center gap-2 text-blue-400 text-sm bg-blue-400/10 border border-blue-400/20 rounded-xl px-4 py-3">
                      <CheckCircle className="w-4 h-4" />
                      Payment confirmed! You&apos;re in.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat access card */}
            {canChat && (
              <Link href={`/chat/${event.id}`}>
                <div className="bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 rounded-2xl p-5 hover:border-violet-500/40 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">Group Chat</p>
                      <p className="text-violet-400/70 text-xs">Paid members only</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs mb-3">
                    Connect with fellow attendees, discuss the party, share plans.
                  </p>
                  <div className="flex items-center gap-1 text-violet-400 text-xs font-medium group-hover:gap-2 transition-all">
                    Open Chat
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </div>
                </div>
              </Link>
            )}

            {!canChat && registration && (
              <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 text-sm">Group Chat</p>
                    <p className="text-slate-600 text-xs">Locked</p>
                  </div>
                </div>
                <p className="text-slate-600 text-xs">
                  Complete payment to unlock the group chat with all attendees.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimelineItem({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 ${color}`}>{icon}</div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-sm text-slate-300">{value}</p>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white/[0.02] border border-white/6 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {review.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white text-sm font-medium">{review.userName}</p>
            <p className="text-slate-600 text-xs">
              {new Date(review.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-3.5 h-3.5 ${
                s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-700"
              }`}
            />
          ))}
        </div>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed">{review.content}</p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#050B18] flex items-center justify-center">
      <div className="text-slate-400 text-sm animate-pulse">Loading event...</div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-[#050B18] flex flex-col items-center justify-center text-center px-4">
      <div className="text-5xl mb-4">🎉</div>
      <h1 className="text-xl font-bold text-white mb-2">Event not found</h1>
      <p className="text-slate-400 mb-6">This event may have been removed.</p>
      <Link
        href="/events"
        className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
      >
        ← Back to Events
      </Link>
    </div>
  );
}
