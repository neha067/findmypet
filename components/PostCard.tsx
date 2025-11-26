"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  runTransaction,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Heart, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

interface PostCardProps {
  postId: string;
  title?: string;
  imageUrl?: string;
  createdAt?: any;
}

export default function PostCard({ postId, title, imageUrl, createdAt }: PostCardProps) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);

  // Load post + comments + like status
  useEffect(() => {
    if (!postId) return;
    if (!db) {
      console.error("Firestore is not initialized");
      setLoading(false);
      return;
    }

    // Create local const for TypeScript type narrowing
    const dbInstance = db;
    
    const postRef = doc(dbInstance, "posts", postId);

    // Real-time listener for post data
    const unsubscribePost = onSnapshot(postRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLikes(data.likeCount || 0);

        // Check if user liked this post
        if (user) {
          const likeRef = doc(dbInstance, "posts", postId, "likes", user.uid);
          const likeSnap = await getDoc(likeRef);
          setIsLiked(likeSnap.exists());
        }
      }
      setLoading(false);
    });

    // Real-time listener for comments
    const commentsRef = collection(dbInstance, "posts", postId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "desc"));
    const unsubscribeComments = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribePost();
      unsubscribeComments();
    };
  }, [postId, user]);

  // Handle like/unlike with transaction for atomicity
  const handleLike = async () => {
    if (!user) {
      alert("Please login to like posts");
      return;
    }
    if (!db) {
      alert("Firebase is not initialized. Please check your configuration.");
      return;
    }
    if (likeLoading) return; // Prevent double-clicks

    setLikeLoading(true);
    const previousLiked = isLiked;
    const previousLikes = likes;

    // Optimistic update (will revert on error)
    setIsLiked(!previousLiked);
    setLikes(previousLiked ? previousLikes - 1 : previousLikes + 1);

    try {
      // TypeScript now knows db is defined after the check above
      const dbInstance = db; // Create a local const for type narrowing
      if (!dbInstance) return;
      
      const postRef = doc(dbInstance, "posts", postId);
      const likeRef = doc(dbInstance, "posts", postId, "likes", user.uid);

      // Use transaction for atomic operations
      await runTransaction(dbInstance, async (transaction) => {
        const postSnap = await transaction.get(postRef);
        
        if (!postSnap.exists()) {
          throw new Error("Post does not exist");
        }

        const likeSnap = await transaction.get(likeRef);
        const currentlyLiked = likeSnap.exists();
        const currentLikeCount = postSnap.data().likeCount || 0;

        if (currentlyLiked === previousLiked) {
          // State matches, proceed with toggle
          if (previousLiked) {
            // Unlike: delete like doc and decrement count
            transaction.delete(likeRef);
            transaction.update(postRef, {
              likeCount: increment(-1),
            });
          } else {
            // Like: create like doc and increment count
            transaction.set(likeRef, {
              userId: user.uid,
              likedAt: serverTimestamp(),
            });
            transaction.update(postRef, {
              likeCount: increment(1),
            });
          }
        } else {
          // State mismatch - someone else changed it, use current state
          throw new Error("Like state changed, please refresh");
        }
      });

      // Transaction succeeded - optimistic update was correct
    } catch (error: any) {
      console.error("Error toggling like:", error);
      // Revert optimistic update on error
      setIsLiked(previousLiked);
      setLikes(previousLikes);
      
      // Show user-friendly error
      if (error.message?.includes("refresh")) {
        alert("Post was updated. Please refresh to see current state.");
      } else {
        alert("Failed to update like. Please try again.");
      }
    } finally {
      setLikeLoading(false);
    }
  };

  // Handle comment add
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      alert("Please login to comment");
      return;
    }
    if (!db) {
      alert("Firebase is not initialized. Please check your configuration.");
      return;
    }

    try {
      const commentsRef = collection(db, "posts", postId, "comments");
      await addDoc(commentsRef, {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userPhoto: user.photoURL || "",
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      });

      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="border dark:border-[#3B3B52] rounded-2xl p-4 shadow-lg bg-white dark:bg-[#1A1A28] max-w-md animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
      </div>
    );
  }

  const displayTitle = title || "Untitled Post";
  const displayImage = imageUrl || "/assets/test1.jpeg";

  return (
    <div className="border dark:border-[#3B3B52] rounded-2xl p-4 shadow-lg bg-white dark:bg-[#1A1A28] max-w-md w-full">
      <h2 className="text-lg font-semibold dark:text-gray-200 mb-3">{displayTitle}</h2>
      
      {imageUrl && (
        <div className="relative w-full h-64 mb-3 rounded-lg overflow-hidden">
          <Image 
            src={displayImage} 
            alt={displayTitle}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
      )}

      {/* Likes */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={handleLike}
          disabled={!user || likeLoading}
          className={`flex items-center gap-1 transition-colors ${
            isLiked 
              ? "text-red-600 hover:text-red-700" 
              : "text-gray-600 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-600"
          } ${!user || likeLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <Heart 
            size={18} 
            fill={isLiked ? "currentColor" : "none"} 
            className={likeLoading ? "animate-pulse" : ""}
          />
          <span className="font-medium">{likes}</span>
        </button>
      </div>

      {/* Comments */}
      <div className="mt-4 border-t dark:border-[#3B3B52] pt-4">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-1 dark:text-gray-300">
          <MessageCircle size={16} /> Comments ({comments.length})
        </h3>

        <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="border dark:border-[#333] p-3 rounded-lg text-sm dark:bg-[#1A1A28] bg-gray-50"
              >
                <div className="flex items-center gap-2 mb-1">
                  {c.userPhoto && (
                    <img 
                      src={c.userPhoto} 
                      alt={c.userName}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <p className="font-semibold text-blue-600 dark:text-blue-400">
                    {c.userName || "Anonymous"}
                  </p>
                </div>
                <p className="text-gray-700 dark:text-gray-200">{c.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Add comment */}
        {user ? (
          <form onSubmit={handleComment} className="flex flex-col gap-2">
            <div className="flex gap-2 w-full">
              <textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 border rounded-md p-2 dark:bg-[#2A2A3C] dark:text-gray-100 dark:border-[#3B3B52] resize-none text-sm"
                rows={2}
              />
              <Button
                type="submit"
                disabled={!newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Please login to comment
          </p>
        )}
      </div>
    </div>
  );
}
