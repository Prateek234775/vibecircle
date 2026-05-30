"use client";

import PostForm from "@/components/PostForm";
import PostFeed from "@/components/PostFeed";

import { useEffect, useState } from "react";

import {
  onAuthStateChanged,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";

import { auth, db } from "@/firebase/config";
import { getUserRegistrations } from "@/lib/firestore";
import { getUserNotifications } from "@/lib/firestore";
import type { Registration, Notification } from "@/types";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [profile, setProfile] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [photoURL, setPhotoURL] =
    useState("");

  const [myRegistrations, setMyRegistrations] =
    useState<Registration[]>([]);

  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    events: 0,
  });

  // Check Login
  useEffect(() => {
    let dataLoaded = false;
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (currentUser) {
            setUser(currentUser);
            setPhotoURL(currentUser.photoURL || "");

            // Only fetch data once per session
            if (dataLoaded) return;
            dataLoaded = true;

            // Get User Data + registrations + notifications in parallel
            const [docSnap, regs, notifs, postsSnap] = await Promise.all([
              getDoc(doc(db, "users", currentUser.uid)),
              getUserRegistrations(currentUser.uid),
              getUserNotifications(currentUser.uid),
              getCountFromServer(
                query(collection(db, "posts"), where("userEmail", "==", currentUser.email))
              ),
            ]);

            if (docSnap.exists()) {
              const profileData = docSnap.data();
              setProfile(profileData);
              setStats({
                posts: postsSnap.data().count,
                followers: profileData?.followersCount ?? 0,
                following: profileData?.followingCount ?? 0,
                events: regs.length,
              });
            }

            setMyRegistrations(regs);
            setUnreadNotifs(notifs.filter((n: Notification) => !n.read).length);
          } else {
            router.push("/login");
          }

          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [router]);

  // Logout
  const handleLogout = async () => {
    await signOut(auth);

    router.push("/login");
  };

  // Save Profile Photo
  const handleSavePhoto =
    async () => {
      if (!auth.currentUser) return;

      await updateProfile(
        auth.currentUser,
        {
          photoURL: photoURL,
        }
      );

      alert("Photo Updated");
    };

  // Loading Screen
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#0f172a",
          color: "white",
          fontSize: "22px",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #1e3a8a, #0f172a)",
        color: "white",
        padding: "40px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: "40px",
        }}
      >
        <h1
          style={{
            fontSize: "35px",
            fontWeight: "bold",
          }}
        >
          VibeCircle Dashboard
        </h1>

        <button
          onClick={handleLogout}
          style={{
            background: "#ef4444",
            border: "none",
            padding: "12px 20px",
            borderRadius: "10px",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Logout
        </button>
      </div>

      {/* Quick Nav */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          flexWrap: "wrap",
          marginBottom: "40px",
        }}
      >
        <Link
          href="/events"
          style={{
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            padding: "16px 24px",
            borderRadius: "16px",
            color: "white",
            fontWeight: "bold",
            textDecoration: "none",
            fontSize: "15px",
          }}
        >
          🎉 Browse Events
        </Link>
        <Link
          href="/events/create"
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
            padding: "16px 24px",
            borderRadius: "16px",
            color: "white",
            fontWeight: "bold",
            textDecoration: "none",
            fontSize: "15px",
          }}
        >
          ➕ Host an Event
        </Link>
        <Link
          href="/host"
          style={{
            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
            padding: "16px 24px",
            borderRadius: "16px",
            color: "white",
            fontWeight: "bold",
            textDecoration: "none",
            fontSize: "15px",
          }}
        >
          🏠 Host Dashboard
        </Link>
        <Link
          href="/notifications"
          style={{
            background: "#1e293b",
            padding: "16px 24px",
            borderRadius: "16px",
            color: "white",
            fontWeight: "bold",
            textDecoration: "none",
            fontSize: "15px",
            border: "1px solid rgba(255,255,255,0.08)",
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🔔 Notifications
          {unreadNotifs > 0 && (
            <span style={{
              background: "#8b5cf6",
              color: "white",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "700",
              padding: "2px 7px",
              lineHeight: 1.4,
            }}>
              {unreadNotifs}
            </span>
          )}
        </Link>
        <Link
          href="/reviews"
          style={{
            background: "#1e293b",
            padding: "16px 24px",
            borderRadius: "16px",
            color: "white",
            fontWeight: "bold",
            textDecoration: "none",
            fontSize: "15px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          ⭐ Reviews
        </Link>
        <Link
          href="/people"
          style={{
            background: "#1e293b",
            padding: "16px 24px",
            borderRadius: "16px",
            color: "white",
            fontWeight: "bold",
            textDecoration: "none",
            fontSize: "15px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          👥 Find People
        </Link>
        <Link
          href="/profile"
          style={{
            background: "#1e293b",
            padding: "16px 24px",
            borderRadius: "16px",
            color: "white",
            fontWeight: "bold",
            textDecoration: "none",
            fontSize: "15px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          👤 Edit Profile
        </Link>
      </div>

      {/* My Registrations */}
      {myRegistrations.length > 0 && (
        <div
          style={{
            background: "#1e293b",
            padding: "25px",
            borderRadius: "20px",
            maxWidth: "700px",
            marginBottom: "40px",
          }}
        >
          <h2 style={{ marginBottom: "20px", fontSize: "20px" }}>
            🎟️ My Event Registrations
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {myRegistrations.map((reg) => (
              <div
                key={reg.id}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p style={{ fontWeight: "600", marginBottom: "4px" }}>
                    Event ID: {reg.eventId.slice(0, 8)}...
                  </p>
                  <p style={{ fontSize: "13px", color: "#94a3b8" }}>
                    Status:{" "}
                    <span
                      style={{
                        color:
                          reg.status === "paid"
                            ? "#34d399"
                            : reg.status === "approved"
                            ? "#60a5fa"
                            : reg.status === "rejected"
                            ? "#f87171"
                            : "#fbbf24",
                        fontWeight: "600",
                        textTransform: "capitalize",
                      }}
                    >
                      {reg.status}
                    </span>
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Link
                    href={`/events/${reg.eventId}`}
                    style={{
                      background: "rgba(99,102,241,0.2)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      color: "#a78bfa",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "600",
                      textDecoration: "none",
                    }}
                  >
                    View Event
                  </Link>
                  {reg.status === "paid" && (
                    <Link
                      href={`/chat/${reg.eventId}`}
                      style={{
                        background: "rgba(139,92,246,0.2)",
                        border: "1px solid rgba(139,92,246,0.3)",
                        color: "#c4b5fd",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        textDecoration: "none",
                      }}
                    >
                      💬 Chat
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "40px",
        }}
      >
        {[
          { label: "Posts", value: stats.posts, icon: "📝" },
          { label: "Followers", value: stats.followers, icon: "👥" },
          { label: "Following", value: stats.following, icon: "➕" },
          { label: "Events", value: stats.events, icon: "🎉" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "#1e293b",
              padding: "20px 24px",
              borderRadius: "20px",
              minWidth: "150px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p style={{ fontSize: "22px", marginBottom: "6px" }}>{stat.icon}</p>
            <p
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                lineHeight: 1,
                marginBottom: "6px",
              }}
            >
              {stat.value}
            </p>
            <h3 style={{ color: "#94a3b8", fontSize: "14px", fontWeight: "normal" }}>
              {stat.label}
            </h3>
          </div>
        ))}
      </div>

      {/* User Card */}
      <div
        style={{
          background: "#1e293b",
          padding: "30px",
          borderRadius: "20px",
          maxWidth: "600px",
          marginBottom: "40px",
          boxShadow:
            "0 0 20px rgba(0,0,0,0.3)",
        }}
      >
        {/* Top */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "25px",
          }}
        >
          <img
            src={
              photoURL ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            alt="profile"
            width={110}
            height={110}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              border:
                "4px solid #3b82f6",
            }}
          />

          <div>
            <h2
              style={{
                fontSize: "30px",
                marginBottom: "10px",
              }}
            >
              Welcome{" "}
              {profile?.name || "User"} 👋
            </h2>

            <p
              style={{
                color: "#94a3b8",
              }}
            >
              Welcome to VibeCircle
            </p>
          </div>
        </div>

        {/* User Info */}
        <div
          style={{
            lineHeight: "35px",
            marginBottom: "25px",
          }}
        >
          <p>
            <strong>Email:</strong>{" "}
            {profile?.email}
          </p>

          <p>
            <strong>Name:</strong>{" "}
            {profile?.name}
          </p>

          <p>
            <strong>User ID:</strong>{" "}
            {user?.uid}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            Logged In
          </p>
        </div>

        {/* Change Photo */}
        <div>
          <input
            type="text"
            placeholder="Paste Image URL"
            value={photoURL}
            onChange={(e) =>
              setPhotoURL(
                e.target.value
              )
            }
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              marginBottom: "12px",
            }}
          />

          <button
            onClick={handleSavePhoto}
            style={{
              background: "#3b82f6",
              border: "none",
              padding: "12px 20px",
              borderRadius: "10px",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Save Photo
          </button>
        </div>
      </div>

      {/* Create Post */}
      <div
        style={{
          background: "#1e293b",
          padding: "25px",
          borderRadius: "20px",
          maxWidth: "700px",
          marginBottom: "40px",
        }}
      >
        <h2
          style={{
            marginBottom: "20px",
          }}
        >
          Create Post
        </h2>

        <PostForm />
      </div>

      {/* Posts Feed */}
      <div
        style={{
          background: "#1e293b",
          padding: "25px",
          borderRadius: "20px",
          maxWidth: "700px",
        }}
      >
        <h2
          style={{
            marginBottom: "20px",
          }}
        >
          Recent Posts
        </h2>

        <PostFeed />
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "60px",
          textAlign: "center",
          color: "#94a3b8",
        }}
      >
        © 2026 VibeCircle — Built by
        Prateek 🚀
      </div>
    </div>
  );
}