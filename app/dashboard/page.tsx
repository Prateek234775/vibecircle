"use client";
import { updateProfile } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/firebase/config";

import { useRouter } from "next/navigation";

import { auth } from "@/firebase/config";
import {
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoURL, setPhotoURL] = useState("");

  // Check login
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {

    if (currentUser) {
      setUser(currentUser);
      setPhotoURL(currentUser.photoURL || "");

      // Fetch Firestore profile
      const docRef = doc(db, "users", currentUser.uid);

      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }

    } else {
      router.push("/login");
    }

    setLoading(false);
  });

  return () => unsubscribe();
  }, [router]);

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // Loading screen
  if (loading) {
    const handleSavePhoto = async () => {
  if (!auth.currentUser) return;

  await updateProfile(auth.currentUser, {
    photoURL: photoURL,
  });

  alert("Profile photo updated!");
  };
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#0f172a",
          color: "white",
          fontSize: "20px",
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
        background: "#0f172a",
        color: "white",
        padding: "40px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
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
            padding: "10px 20px",
            borderRadius: "10px",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Logout
        </button>
      </div>

      {/* User Card */}
      <div
        style={{
          background: "#1e293b",
          padding: "30px",
          borderRadius: "20px",
          maxWidth: "500px",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            marginBottom: "20px",
          }}
        >
          Welcome {profile?.name} 👋
        </h2>
        <div style={{ marginBottom: "20px" }}>
         <img
          src={
          photoURL ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png"
          }
          alt="profile"
          width={100}
          height={100}
          style={{
           borderRadius: "50%",
           marginBottom: "15px",
           objectFit: "cover",
         }}
      />

         <input
          type="text"
          placeholder="Paste image URL"
          value={photoURL}
          onChange={(e) => setPhotoURL(e.target.value)}
          style={{
           width: "100%",
           padding: "10px",
           borderRadius: "10px",
           border: "none",
           marginBottom: "10px",
          }}
        />

        <button
          onClick={handleSavePhoto}
          style={{
           background: "#3b82f6",
          border: "none",
          padding: "10px 20px",
          borderRadius: "10px",
          color: "white",
          cursor: "pointer",
          fontWeight: "bold",
        }}
       >
      Save Photo
     </button>
    </div>

        <p style={{ marginBottom: "10px" }}>
          <strong>Email:</strong> {profile?.email}
          <p style={{ marginBottom: "10px" }}>
            <strong>Name:</strong> {user?.displayName}
         </p>
        </p>

        <p style={{ marginBottom: "10px" }}>
          <strong>User ID:</strong> {user?.uid}
        </p>

        <p>
          <strong>Status:</strong> Logged In
        </p>
      </div>
    </div>
  );
}