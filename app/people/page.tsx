"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/config";
import {
  getAllUsers,
  followUser,
  unfollowUser,
  getFollowing,
} from "@/lib/firestore";
import type { UserSummary } from "@/types";
import { Zap, Search, UserPlus, UserCheck, ArrowLeft, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";

export default function PeoplePage() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setUid(user.uid);

      const [allUsers, following] = await Promise.all([
        getAllUsers(),
        getFollowing(user.uid),
      ]);

      // Exclude self
      setUsers(allUsers.filter((u) => u.uid !== user.uid));
      setFollowingIds(new Set(following));
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleFollow = async (targetUid: string) => {
    if (!uid || actionLoading) return;
    setActionLoading(targetUid);
    try {
      if (followingIds.has(targetUid)) {
        await unfollowUser(uid, targetUid);
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(targetUid);
          return next;
        });
        // Decrement local count
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === targetUid
              ? { ...u, followersCount: Math.max(0, (u.followersCount ?? 0) - 1) }
              : u
          )
        );
      } else {
        await followUser(uid, targetUid);
        setFollowingIds((prev) => new Set(prev).add(targetUid));
        // Increment local count
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === targetUid
              ? { ...u, followersCount: (u.followersCount ?? 0) + 1 }
              : u
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.profession?.toLowerCase().includes(search.toLowerCase()) ||
      u.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050B18] text-white">
      {/* Header */}
      <header className="border-b border-white/8 bg-[#080F1E]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">
              Vibe<span className="text-blue-400">Circle</span>
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="mb-8">
          <div className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-2">
            Community
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Find People</h1>
          <p className="text-slate-400 text-sm">
            Discover and follow other VibeCircle members.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, profession or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all"
          />
        </div>

        {/* Stats bar */}
        <div className="flex gap-6 mb-6 text-sm text-slate-400">
          <span>{users.length} members</span>
          <span>·</span>
          <span className="text-violet-400">{followingIds.size} following</span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white/[0.03] border border-white/8 rounded-2xl h-40 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <div className="text-4xl mb-3">👥</div>
            <p>No members found matching &quot;{search}&quot;</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((person) => (
              <PersonCard
                key={person.uid}
                person={person}
                isFollowing={followingIds.has(person.uid)}
                isLoading={actionLoading === person.uid}
                onToggleFollow={() => handleFollow(person.uid)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Person Card ──────────────────────────────────────────────────────────────

function PersonCard({
  person,
  isFollowing,
  isLoading,
  onToggleFollow,
}: {
  person: UserSummary;
  isFollowing: boolean;
  isLoading: boolean;
  onToggleFollow: () => void;
}) {
  const initials = (person.name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div className="bg-white/[0.03] border border-white/8 hover:border-white/14 rounded-2xl p-5 transition-all flex flex-col gap-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">{person.name}</p>
          {person.profession && (
            <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
              <Briefcase className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{person.profession}</span>
            </div>
          )}
          {person.city && (
            <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{person.city}</span>
            </div>
          )}
        </div>
      </div>

      {/* Follower counts */}
      <div className="flex gap-4 text-xs text-slate-500">
        <span>
          <span className="text-white font-semibold">{person.followersCount ?? 0}</span>{" "}
          followers
        </span>
        <span>
          <span className="text-white font-semibold">{person.followingCount ?? 0}</span>{" "}
          following
        </span>
      </div>

      {/* Follow button */}
      <button
        onClick={onToggleFollow}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
          isFollowing
            ? "bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400"
            : "bg-blue-600/20 border border-blue-500/20 text-blue-300 hover:bg-blue-600/30"
        } disabled:opacity-50`}
      >
        {isLoading ? (
          <span className="animate-pulse">...</span>
        ) : isFollowing ? (
          <>
            <UserCheck className="w-3.5 h-3.5" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="w-3.5 h-3.5" />
            Follow
          </>
        )}
      </button>
    </div>
  );
}
