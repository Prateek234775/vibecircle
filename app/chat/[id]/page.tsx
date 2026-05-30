"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import {
  getEvent,
  getRegistration,
  sendChatMessage,
  getUserProfile,
} from "@/lib/firestore";
import type { PartyEvent, ChatMessage } from "@/types";
import {
  Send,
  Zap,
  ArrowLeft,
  Users,
  Lock,
  Calendar,
  MapPin,
} from "lucide-react";
import Link from "next/link";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<PartyEvent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const [uid, setUid] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userPhoto, setUserPhoto] = useState("");

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auth + access check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);

      const [profile, ev, reg] = await Promise.all([
        getUserProfile(user.uid),
        getEvent(eventId),
        getRegistration(eventId, user.uid),
      ]);

      setUserName(profile?.name ?? user.displayName ?? "User");
      setUserPhoto(profile?.photoURL ?? user.photoURL ?? "");
      setEvent(ev);

      // Only paid members can access chat
      if (!reg || reg.status !== "paid") {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setLoading(false);
    });
    return () => unsub();
  }, [eventId, router]);

  // Real-time messages
  useEffect(() => {
    if (!eventId || loading || accessDenied) return;

    const q = query(
      collection(db, "chats", eventId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs: ChatMessage[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          eventId,
          userId: data.userId,
          userName: data.userName,
          userPhoto: data.userPhoto ?? "",
          text: data.text,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : data.createdAt ?? new Date().toISOString(),
        };
      });
      setMessages(msgs);
    });

    return () => unsub();
  }, [eventId, loading, accessDenied]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || !uid || sending) return;
    setSending(true);
    try {
      await sendChatMessage(eventId, uid, userName, text.trim(), userPhoto);
      setText("");
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) return <LoadingScreen />;

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#050B18] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
          <Lock className="w-7 h-7 text-slate-500" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Access Restricted</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          This group chat is only available to paid attendees. Complete your payment to join the conversation.
        </p>
        <Link
          href={`/events/${eventId}`}
          className="bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:from-blue-500 hover:to-violet-500"
        >
          Go to Event
        </Link>
      </div>
    );
  }

  // Group messages by date
  const grouped = messages.reduce<Record<string, ChatMessage[]>>((acc, msg) => {
    const day = new Date(msg.createdAt).toDateString();
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#050B18] text-white flex flex-col">
      {/* ── Header ── */}
      <header className="border-b border-white/8 bg-[#080F1E]/90 backdrop-blur-xl sticky top-0 z-40 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link
            href={`/events/${eventId}`}
            className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">
                {event?.title ?? "Party Chat"}
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                {event && (
                  <>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {fmtDateShort(event.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full flex-shrink-0">
            <Users className="w-3 h-3" />
            Paid Members
          </div>
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Welcome banner */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs px-4 py-2 rounded-full">
              <Zap className="w-3.5 h-3.5" />
              Welcome to the {event?.title} group chat! Only paid attendees can see this.
            </div>
          </div>

          {messages.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm">No messages yet. Say hello to your fellow party-goers!</p>
            </div>
          )}

          {Object.entries(grouped).map(([day, dayMsgs]) => (
            <div key={day}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-slate-600 flex-shrink-0">
                  {new Date(day).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <div className="space-y-3">
                {dayMsgs.map((msg, i) => {
                  const isOwn = msg.userId === uid;
                  const showAvatar =
                    i === 0 || dayMsgs[i - 1].userId !== msg.userId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-8">
                        {showAvatar && !isOwn && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold">
                            {msg.userName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
                        {showAvatar && (
                          <span
                            className={`text-xs text-slate-500 px-1 ${isOwn ? "text-right" : ""}`}
                          >
                            {isOwn ? "You" : msg.userName}
                          </span>
                        )}
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isOwn
                              ? "bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-br-sm"
                              : "bg-white/[0.06] border border-white/8 text-slate-200 rounded-bl-sm"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-slate-600 px-1">
                          {fmtTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input ── */}
      <div className="border-t border-white/8 bg-[#080F1E]/90 backdrop-blur-xl flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-white/[0.04] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-40 flex items-center justify-center transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#050B18] flex items-center justify-center">
      <div className="text-slate-400 text-sm animate-pulse">Loading chat...</div>
    </div>
  );
}
