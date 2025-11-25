"use client";

import { useEffect, useState } from "react";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Heart, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import Image from "next/image";
export default function PostCard({ postId, title }) {
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [name, setName] = useState("");

  // Load post + comments
  useEffect(() => {
    const loadData = async () => {
      const postRef = doc(db, "posts", postId);
      const snap = await getDoc(postRef);

      if (snap.exists()) {
        setLikes(snap.data().likes || 0);
      } else {
        // create post if missing
        await setDoc(postRef, { title, likes: 0 });
      }

      const commentsRef = collection(db, "posts", postId, "comments");
      const commentsSnap = await getDocs(commentsRef);
      setComments(commentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    loadData();
  }, [postId]);

  // Handle like
  const handleLike = async () => {
    const ref = doc(db, "posts", postId);
    await updateDoc(ref, { likes: increment(1) });
    setLikes((prev) => prev + 1);
  };

  // Handle comment add
  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !name.trim()) return;

    const commentsRef = collection(db, "posts", postId, "comments");
    const newDoc = await addDoc(commentsRef, {
      name,
      text: newComment,
      createdAt: new Date(),
    });

    setComments((prev) => [...prev, { id: newDoc.id, name, text: newComment }]);
    setNewComment("");
  };

  return (
    <div className="border dark:border-[#3B3B52] rounded-2xl p-4 shadow-lg bg-white dark:bg-[#1A1A28] max-w-md">
      <h2 className="text-lg font-semibold dark:text-gray-200">{title}</h2>
      <Image src="/assets/test1.jpeg" width={300} height={400} alt="img" />
      {/* Likes */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={handleLike}
          className="flex items-center gap-1 text-pink-600 hover:text-pink-700"
        >
          <Heart size={18} />
          <span>{likes}</span>
        </button>
      </div>

      {/* Comments */}
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2 flex items-center gap-1 dark:text-gray-300">
          <MessageCircle size={16} /> Comments ({comments.length})
        </h3>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {comments.map((c) => (
            <div
              key={c.id}
              className="border dark:border-[#333] p-2 rounded-lg text-sm dark:text-gray-200"
            >
              <p className="font-semibold text-blue-600 dark:text-blue-400">
                {c.name}
              </p>
              <p>{c.text}</p>
            </div>
          ))}
        </div>

        {/* Add comment */}
        <form onSubmit={handleComment} className="mt-3 flex flex-col gap-2">
          {/* <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded-md p-2 dark:bg-[#2A2A3C] dark:text-gray-100"
          /> */}
          <div className="grid grid-cols-5 gap-2 w-full">
            <textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="border h-13 col-span-4 rounded-md p-2 dark:bg-[#2A2A3C] dark:text-gray-100 resize-none"
              rows={3}
            />
            <Button
              type="submit"
              className="col-span-1 w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-md"
            >
              Post
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
