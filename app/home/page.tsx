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
import UnifiedMap from "./components/UnifiedMap"
import HomePage from "./components/HomePage"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
// import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import  AppSidebar  from "@/components/app-sidebar"
interface Post {
  id: string;
  title: string;
  likes?: number;
  createdAt?: any; // Firestore timestamp
}
export default function home({}) {
  // const [user, setUser] = useState<any>(null)
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
      {/* <div className="flex items-center space-x-4">
        {/* <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full" /> */}
        {/* <span>Hi, {user.displayName}</span> */}
        {/* <VisitCounter /> 
        <button
          onClick={logout}
          className="px-3 py-1 bg-red-500 text-white rounded-md"
        >
          Logout
        </button>
      </div> */}
      <div>
       {/* <CreatePost onCreated={loadPosts} /> */}
      
      <div className="w-full">
          {/* <SidebarProvider>
              <AppSidebar /> */}
              {/* <SidebarTrigger /> */}
        <HomePage/>
         {/* </SidebarProvider> */}
            
      <div>
      {/* {posts.length > 0 ? (
        posts.map((p) => <PostCard key={p.id} postId={p.id} title={p.title} />)
      ) : (
        <p className="text-gray-500">No posts yet. Create one above!</p>
      )} */}
      </div>
        {/* <ScrollArea /> */}
        {/* <UnifiedMap /> */}
        </div>
      </div>
      </>
    )
}
