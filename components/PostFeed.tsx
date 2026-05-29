"use client";

import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  increment,
  addDoc,
} from "firebase/firestore";

import { db, auth } from "@/firebase/config";

export default function PostFeed() {
  const [posts, setPosts] =
    useState<any[]>([]);

  const [commentText, setCommentText] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [darkMode, setDarkMode] =
    useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe =
      onSnapshot(q, (snapshot) => {
        const allPosts =
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

        setPosts(allPosts);
      });

    return () => unsubscribe();
  }, []);

  // Delete
  const handleDelete =
    async (id: string) => {
      await deleteDoc(
        doc(db, "posts", id)
      );
    };

  // Like
  const handleLike =
    async (id: string) => {
      const postRef = doc(
        db,
        "posts",
        id
      );

      await updateDoc(postRef, {
        likes: increment(1),
      });
    };

  // Comment
  const handleComment =
    async (postId: string) => {
      if (!commentText.trim()) return;

      await addDoc(
        collection(
          db,
          "posts",
          postId,
          "comments"
        ),
        {
          text: commentText,
          userName:
            auth.currentUser
              ?.displayName ||
            "Anonymous",
        }
      );

      setCommentText("");
    };

  // Search filter
  const filteredPosts =
    posts.filter((post) =>
      post.text
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <div
      style={{
        background: darkMode
          ? "#0f172a"
          : "#f1f5f9",

        minHeight: "100vh",
        padding: "20px",
        color: darkMode
          ? "white"
          : "black",
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            border: "none",
          }}
        />

        {/* Dark Mode */}
        <button
          onClick={() =>
            setDarkMode(
              !darkMode
            )
          }
          style={{
            padding: "12px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {darkMode
            ? "☀️ Light"
            : "🌙 Dark"}
        </button>

        {/* Notifications */}
        <button
          style={{
            padding: "12px",
            borderRadius: "10px",
            border: "none",
          }}
        >
          🔔 Notifications
        </button>
      </div>

      {/* Posts */}
      {filteredPosts.map((post) => (
        <div
          key={post.id}
          style={{
            background: darkMode
              ? "#1e293b"
              : "white",

            padding: "20px",
            borderRadius: "20px",
            marginBottom: "20px",
          }}
        >
          {/* User */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "15px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <img
                src={
                  post.userPhoto ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt="user"
                width={55}
                height={55}
                style={{
                  borderRadius:
                    "50%",
                }}
              />

              <div>
                <h3>
                  {post.userName}
                </h3>

                <p
                  style={{
                    fontSize:
                      "14px",
                    opacity: 0.7,
                  }}
                >
                  {
                    post.userEmail
                  }
                </p>

                <p
                  style={{
                    fontSize:
                      "12px",
                    opacity: 0.5,
                  }}
                >
                  {post.createdAt
                    ?.seconds
                    ? new Date(
                        post.createdAt.seconds *
                          1000
                      ).toLocaleString()
                    : "Just now"}
                </p>
              </div>
            </div>

            {/* Follow Button */}
            <button
              style={{
                background:
                  "#3b82f6",
                border: "none",
                padding:
                  "10px 16px",
                borderRadius:
                  "10px",
                color: "white",
                cursor: "pointer",
              }}
            >
              Follow
            </button>
          </div>

          {/* Post Text */}
          <p
            style={{
              fontSize: "17px",
              marginBottom: "15px",
              lineHeight: "28px",
            }}
          >
            {post.text}
          </p>

          {/* Post Image */}
          {post.image && (
            <img
              src={post.image}
              alt="post"
              style={{
                width: "100%",
                borderRadius:
                  "15px",
                marginBottom:
                  "20px",
              }}
            />
          )}

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <button
              onClick={() =>
                handleLike(
                  post.id
                )
              }
              style={{
                background:
                  "#ec4899",
                border: "none",
                padding:
                  "10px 16px",
                borderRadius:
                  "10px",
                color: "white",
                cursor: "pointer",
              }}
            >
              ❤️ {
                post.likes || 0
              }
            </button>

            <button
              style={{
                background:
                  "#22c55e",
                border: "none",
                padding:
                  "10px 16px",
                borderRadius:
                  "10px",
                color: "white",
              }}
            >
              💬 Comment
            </button>

            <button
              style={{
                background:
                  "#eab308",
                border: "none",
                padding:
                  "10px 16px",
                borderRadius:
                  "10px",
                color: "white",
              }}
            >
              🔗 Share
            </button>

            <button
              onClick={() =>
                handleDelete(
                  post.id
                )
              }
              style={{
                background:
                  "#ef4444",
                border: "none",
                padding:
                  "10px 16px",
                borderRadius:
                  "10px",
                color: "white",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>

          {/* Comment Input */}
          <div>
            <input
              type="text"
              placeholder="Write comment..."
              value={commentText}
              onChange={(e) =>
                setCommentText(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                borderRadius:
                  "10px",
                border: "none",
                marginBottom:
                  "10px",
              }}
            />

            <button
              onClick={() =>
                handleComment(
                  post.id
                )
              }
              style={{
                background:
                  "#3b82f6",
                border: "none",
                padding:
                  "10px 16px",
                borderRadius:
                  "10px",
                color: "white",
                cursor: "pointer",
              }}
            >
              Add Comment
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}