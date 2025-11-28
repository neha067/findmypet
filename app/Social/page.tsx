"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PostCard from "@/components/PostCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import CreatePostForm from "./components/CreatePostForm";
import FoundForm from "./components/FoundForm";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Post {
  id: string;
  title?: string;
  type?: "missing" | "found" | "adoption" | "social";
  petType?: "cat" | "dog" | "other";
  catId?: string;
  likes?: number;
  likeCount?: number;
  createdAt?: any;
  imageUrl?: string;
  description?: string;
}

interface FilterState {
  missingCatCheck: boolean;
  foundCatCheck: boolean;
  petTypeFilter: "cat" | "dog" | "other" | null;
  colorFilter: string | null;
  ageFilter: string | null;
}

interface PetData {
  id: string;
  petType?: "cat" | "dog" | "other";
  color?: string;
  age?: string;
  status?: string;
}

interface SocialProps {
  filterState?: FilterState;
  catData?: PetData[];
}

const Social = ({ filterState, catData = [] }: SocialProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("timeline");
  
  // Filter posts when filterState or posts change
  const filteredPosts = (() => {
    if (!filterState) {
      return posts;
    }

    return posts.filter((post) => {
      // Filter by pet type first (if filter is active)
      if (filterState.petTypeFilter) {
        // Get petType from post or linked cat
        let postPetType: string | undefined = post.petType;
        
        // If post doesn't have petType but has catId, get it from cat data
        if (!postPetType && post.catId && catData.length > 0) {
          const cat = catData.find((c) => c.id === post.catId);
          postPetType = cat?.petType;
        }
        
        // Default to "cat" for backward compatibility if no petType found
        const normalizedPostPetType = String(postPetType || "cat").toLowerCase().trim();
        const normalizedFilterPetType = String(filterState.petTypeFilter).toLowerCase().trim();
        
        if (normalizedPostPetType !== normalizedFilterPetType) {
          return false;
        }
      }

      // Filter by type (missing/found/adoption/social)
      // Social posts are always shown if no filters are active or if filters allow it
      const typeMatches = 
        (filterState.missingCatCheck && post.type === "missing") ||
        (filterState.foundCatCheck && post.type === "found") ||
        (post.type === "adoption") || // Adoption posts shown if any filter is active
        (post.type === "social"); // Social posts shown if any filter is active

      // If both checkboxes are unchecked, only show adoption and social posts
      if (!filterState.missingCatCheck && !filterState.foundCatCheck) {
        // Only show adoption and social posts when no status filters are active
        return post.type === "adoption" || post.type === "social";
      }

      if (!typeMatches) {
        return false;
      }

      // Social posts don't have catId, so skip cat-based filtering for them
      if (post.type === "social") {
        return true; // Social posts pass through without cat-based filtering
      }

      // Filter by color/age if post has catId and we have cat data
      if (post.catId && catData.length > 0) {
        const cat = catData.find((c) => c.id === post.catId);
        
        if (cat) {
          // Filter by color
          if (filterState.colorFilter) {
            if (!cat.color || String(cat.color).toLowerCase().trim() !== String(filterState.colorFilter).toLowerCase().trim()) {
              return false;
            }
          }

          // Filter by age
          if (filterState.ageFilter) {
            if (!cat.age) {
              return false;
            }
            const itemAge = String(cat.age).toLowerCase().trim();
            const filterAge = String(filterState.ageFilter).toLowerCase().trim();
            
            if (itemAge !== filterAge) {
              if (filterAge === "adult" && itemAge === "senior") {
                // Senior cats included in adult
              } else {
                return false;
              }
            }
          }
        }
      }

      return true;
    });
  })();
  

  // Real-time listener for posts
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Check if Firebase is initialized
    if (!db) {
      console.error("Firestore is not initialized. Check Firebase configuration.");
      setLoading(false);
      return;
    }

    try {
      const postsRef = collection(db, "posts");
      const q = query(postsRef, orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const data: Post[] = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...(doc.data() as Omit<Post, "id">),
            }));
            setPosts(data);
            setLoading(false);
          } catch (error) {
            console.error("Error processing posts data:", error);
            setLoading(false);
            setPosts([]);
          }
        },
        (error) => {
          console.error("Error loading posts:", error);
          setLoading(false);
          setPosts([]);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up posts listener:", error);
      setLoading(false);
      setPosts([]);
    }
  }, []);
  return (
    <div className="w-full max-w-5xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-[50%] grid-cols-3 ">
          <TabsTrigger value="timeline" className="cursor-pointer">Timeline</TabsTrigger>
          <TabsTrigger value="create" className="cursor-pointer">Create a Post</TabsTrigger>
          {/* <TabsTrigger value="found">Report Found</TabsTrigger> */}
        </TabsList>
        
        <TabsContent value="timeline" className="mt-4">
          {/* Quick Create Post Buttons */}
          <div className="mb-4 flex gap-2 flex-wrap">
            <Button
              onClick={() => setActiveTab("create")}
              className="border justify-end border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg transition-colors text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              // className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              🐱 Create a Post
            </Button>
            {/* <button
              onClick={() => setActiveTab("found")}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              ✅ Report Found Cat
            </button> */}
          </div>
          
          <ScrollArea className="h-[calc(100vh-13rem)] w-full rounded-md border dark:border-slate-700 p-4">
            <div className="w-full flex flex-col items-center gap-4">
              {loading ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading posts...</p>
                </div>
              ) : filteredPosts.length > 0 ? (
                <>
                  {filterState && (filterState.missingCatCheck !== true || filterState.foundCatCheck !== true || filterState.petTypeFilter || filterState.colorFilter || filterState.ageFilter) && (
                    <div className="w-full mb-2 px-3 py-2 bg-violet-100 dark:bg-violet-900/30 border border-violet-300 dark:border-violet-700 rounded-lg text-sm">
                      <span className="text-violet-800 dark:text-violet-200">
                        🔍 Showing {filteredPosts.length} of {posts.length} posts
                      </span>
                    </div>
                  )}
                  {filteredPosts.map((p) => {
                    // Find petType from linked cat if not in post
                    const petType = p.petType || (p.catId && catData.find((c) => c.id === p.catId)?.petType);
                    return (
                      <PostCard 
                        key={p.id} 
                        postId={p.id} 
                        title={p.title || "Untitled Post"}
                        imageUrl={p.imageUrl}
                        petType={petType}
                      />
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    No posts yet.
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Report a missing or found pet to start the timeline!
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="create" className="mt-4">
          <CreatePostForm />
        </TabsContent>
        
        <TabsContent value="found" className="mt-4">
          <FoundForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Social;