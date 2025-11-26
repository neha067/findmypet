"use client";

import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export default function CreatePost({ onCreated }: { onCreated?: (id: string) => void }) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<FileList | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      if (!db) {
        console.error("Firestore is not initialized");
        return;
      }
      const colRef = collection(db, "posts");
      // create the post document first so we can attach images under its id
      const docRef = await addDoc(colRef, { title, likes: 0, createdAt: new Date(), images: [] });
      setTitle("");

      // If any images were selected, upload them and then update the post with URLs
      // if (images && images.length > 0) {
      //   const files = Array.from(images) as File[];
      //   const uploadedUrls: string[] = [];

      //   for (const file of files) {
      //     const imageRef = storageRef(storage, `posts/${docRef.id}/${Date.now()}_${file.name}`);
      //     await uploadBytes(imageRef, file);
      //     const url = await getDownloadURL(imageRef);
      //     uploadedUrls.push(url);
      //   }

        // update the post document with the image URLs
        // await updateDoc(doc(db, "posts", docRef.id), { images: uploadedUrls });
      // }

      // Notify parent to refresh list
      // if (onCreated) onCreated(docRef.id);
    } catch (err) {
      console.error("Error creating post:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleCreate}
      className="flex gap-2 items-center w-full max-w-md mb-4"
    >
      <input
        type="text"
        placeholder="Post title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 border rounded-lg p-2 dark:bg-[#2A2A3C] dark:text-gray-100"
      />
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setImages(e.target.files)}
        className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-600 file:text-white"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg"
      >
        {loading ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
