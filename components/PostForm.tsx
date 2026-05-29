"use client";

import { useState } from "react";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db, auth } from "@/firebase/config";

export default function PostForm() {
  const [text, setText] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handlePost =
    async () => {
      if (!text.trim()) return;

      try {
        setLoading(true);

        await addDoc(
          collection(db, "posts"),
          {
            text: text,
            userName:
              auth.currentUser
                ?.displayName ||
              "Anonymous",

            userEmail:
              auth.currentUser
                ?.email,

            userPhoto:
              auth.currentUser
                ?.photoURL,

            createdAt:
              serverTimestamp(),
          }
        );

        setText("");

      } catch (error) {
        console.log(error);
      }

      setLoading(false);
    };

  return (
    <div>
      <textarea
        placeholder="What's on your mind?"
        value={text}
        onChange={(e) =>
          setText(e.target.value)
        }
        style={{
          width: "100%",
          height: "120px",
          padding: "15px",
          borderRadius: "15px",
          border: "none",
          resize: "none",
          marginBottom: "15px",
        }}
      />

      <button
        onClick={handlePost}
        style={{
          background: "#3b82f6",
          border: "none",
          padding: "12px 20px",
          borderRadius: "10px",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {loading
          ? "Posting..."
          : "Post"}
      </button>
    </div>
  );
}