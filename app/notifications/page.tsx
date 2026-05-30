"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/config";
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/firestore";
import type { Notification } from "@/types";
import { Zap, ArrowLeft, Bell, CheckCheck, Calendar, IndianRupee, PartyPopper, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  booking_confirmed: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  party_reminder: <Calendar className="w-5 h-5 text-blue-400" />,
  new_booking: <Bell className="w-5 h-5 text-violet-400" />,
  event_approved: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  event_rejected: <XCircle className="w-5 h-5 text-red-400" />,
  refund_request: <IndianRupee className="w-5 h-5 text-amber-400" />,
};

const NOTIF_BG: Record<string, string> = {
  booking_confirmed: "bg-emerald-500/10 border-emerald-500/20",
  party_reminder: "bg-blue-500/10 border-blue-500/20",
  new_booking: "bg-violet-500/10 border-violet-500/20",
  event_approved: "bg-emerald-500/10 border-emerald-500/20",
  event_rejected: "bg-red-500/10 border-red-500/20",
  refund_request: "bg-amber-500/10 border-amber-500/20",
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setUid(user.uid);
      const notifs = await getUserNotifications(user.uid);
      setNotifications(notifs);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleRead = async (notif: Notification) => {
    if (notif.read) return;
    await markNotificationRead(notif.id);
    setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    if (!uid) return;
    await markAllNotificationsRead(uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#050B18] text-white">
      <header className="border-b border-white/8 bg-[#080F1E]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Vibe<span className="text-blue-400">Circle</span></span>
          </Link>
          <Link href="/dashboard" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-violet-400" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-sm font-normal text-white bg-violet-600 px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/5 border border-white/8 px-3 py-2 rounded-xl transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => <div key={i} className="h-20 bg-white/[0.03] border border-white/8 rounded-2xl animate-pulse" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-400 mb-1">All caught up!</p>
            <p className="text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleRead(notif)}
                className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                  notif.read
                    ? "bg-white/[0.02] border-white/6 opacity-70"
                    : `${NOTIF_BG[notif.type] ?? "bg-white/[0.04] border-white/10"} hover:opacity-90`
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  notif.read ? "bg-white/5" : "bg-white/10"
                }`}>
                  {NOTIF_ICONS[notif.type] ?? <Bell className="w-5 h-5 text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${notif.read ? "text-slate-400" : "text-white"}`}>
                      {notif.title}
                    </p>
                    <span className="text-slate-600 text-xs flex-shrink-0">{fmtTime(notif.createdAt)}</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{notif.message}</p>
                  {notif.eventId && (
                    <Link
                      href={`/events/${notif.eventId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-400 hover:text-blue-300 mt-1.5 inline-block transition-colors"
                    >
                      View Event →
                    </Link>
                  )}
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
