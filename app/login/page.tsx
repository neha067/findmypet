"use client"
import { loginWithGoogle, logout } from "@/lib/firebase"
import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import ScrollArea from "@/components/ScrollArea"
import VisitCounter from "@/components/VisitCounter"
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Home from "../home/page"
import LoginPage from "./components/LoginPage"
interface Post {
  id: string;
  title: string;
  likes?: number;
  createdAt?: any; // Firestore timestamp
}
export default function Login() {
 
 const [posts, setPosts] = useState<Post[]>([]);

  // Load all posts from Firestore
  const loadPosts = async () => {
    try {
      const ref = collection(db, "posts");
      const snap = await getDocs(ref);
      const data: Post[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Post, "id">),
      }));
      setPosts(data);
    } catch (err) {
      console.error("Error loading posts:", err);
    }
  };

  

  useEffect(() => {
    loadPosts()
  },[])

 

  return (
    <>
    <LoginPage loginWithGoogle={loginWithGoogle}/>
    {/* <button
      onClick={loginWithGoogle}
      className="px-4 py-2 bg-blue-500 text-white rounded-md"
    >
      Login with Google
    </button> */}
    </>
  )
}
