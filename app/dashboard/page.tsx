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
} from "firebase/firestore";

import { auth, db } from "@/firebase/config";

import { useRouter } from "next/navigation";

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

  // Check Login
  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (currentUser) {
            setUser(currentUser);

            setPhotoURL(
              currentUser.photoURL || ""
            );

            // Get User Data
            const docRef = doc(
              db,
              "users",
              currentUser.uid
            );

            const docSnap =
              await getDoc(docRef);

            if (docSnap.exists()) {
              setProfile(docSnap.data());
            }
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

      {/* Stats */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "20px",
            width: "180px",
          }}
        >
          <h3>Posts</h3>

          <p
            style={{
              fontSize: "30px",
            }}
          >
            12
          </p>
        </div>

        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "20px",
            width: "180px",
          }}
        >
          <h3>Followers</h3>

          <p
            style={{
              fontSize: "30px",
            }}
          >
            540
          </p>
        </div>

        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "20px",
            width: "180px",
          }}
        >
          <h3>Following</h3>

          <p
            style={{
              fontSize: "30px",
            }}
          >
            210
          </p>
        </div>
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