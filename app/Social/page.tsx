"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import PostCard from "@/components/PostCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import CreatePostForm from "./components/CreatePostForm";
import FoundForm from "./components/FoundForm";
import SearchPetForm from "./components/SearchPetForm";
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
  reportedBy?: {
    uid: string;
    name: string;
    email: string;
    photo?: string;
  };
}

interface FilterState {
  missingCatCheck: boolean;
  foundCatCheck: boolean;
  adoptionCheck: boolean;
  socialCheck: boolean;
  petTypeFilter: "cat" | "dog" | "other" | null;
  colorFilter: string | null;
  ageFilter: string | null;
}

interface PetData {
  id: string;
  petType?: "cat" | "dog" | "other";
  name?: string;
  status: string;
  daysAgo?: number;
  position: [number, number];
  color?: string;
  gender?: string;
  age?: string;
  location?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
}


interface FoundPetData {
  petType: "cat" | "dog" | "other" | "";
  color: string;
  gender: string;
  age: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  foundDate?: string;
  foundMonth?: string;
  foundYear?: string;
  description?: string;
  targetOwnerEmail?: string;
  targetOwnerName?: string;
  targetPostId?: string;
}

interface SocialProps {
  filterState?: FilterState;
  catData?: PetData[];
  handleShowInMap?: (petId: string, location: [number, number]) => void;
}

const SocialContent = ({ filterState, catData = [], handleShowInMap }: SocialProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("timeline");
  const [foundPetData, setFoundPetData] = useState<FoundPetData>({
    petType: "",
    color: "",
    gender: "",
    age: ""
  });
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const { user } = useAuth();
  const [showMyPosts, setShowMyPosts] = useState(false);
  const searchParams = useSearchParams();
  const postIdFromUrl = searchParams.get("id");
  const router = useRouter();

  const changeTabToCreate = (data: any) => {
    console.log('pet', data);
    setFoundPetData({
      petType: data?.petType || "",
      color: data?.color || "",
      gender: data?.gender || "",
      age: data?.age || "",
      location: data?.location || "",
      latitude: data?.latitude?.toString() || (data?.position ? data.position[0]?.toString() : ""),
      longitude: data?.longitude?.toString() || (data?.position ? data.position[1]?.toString() : ""),
      foundDate: data?.foundDate || "",
      foundMonth: data?.foundMonth || "",
      foundYear: data?.foundYear || "",
      description: data?.description || "",
      targetOwnerEmail: data?.targetOwnerEmail || "",
      targetOwnerName: data?.targetOwnerName || "",
      targetPostId: data?.targetPostId || ""
    });
  }

  const handleSearch = (searchParams: any) => {
    setSearchResults(searchParams);
  }

  const matchingSearchPosts: Post[] | null =
    Array.isArray(searchResults?.similarPostIds) && searchResults.similarPostIds.length > 0
      ? (searchResults.similarPostIds as string[])
          .map((postId) => posts.find((post) => post.id === postId))
          .filter((post): post is Post => Boolean(post))
      : null;

  const attributeFilteredSearchPosts: Post[] = posts.filter((p) => {
    if (!searchResults) {
      return false;
    }

    if (searchResults.animal && searchResults.animal !== "unknown") {
      let postPetType = p.petType;
      if (!postPetType && p.catId && catData.length > 0) {
        const pet = catData.find((c) => c.id === p.catId);
        postPetType = pet?.petType;
      }
      const postType = String(postPetType || "").toLowerCase().trim();
      const searchType = String(searchResults.animal).toLowerCase().trim();
      if (postType !== searchType) return false;
    }

    if (searchResults.color) {
      if (p.catId && catData.length > 0) {
        const pet = catData.find((c) => c.id === p.catId);
        if (!pet?.color || String(pet.color).toLowerCase().trim() !== String(searchResults.color).toLowerCase().trim()) {
          return false;
        }
      }
    }

    if (searchResults.age && searchResults.age !== "unknown") {
      if (p.catId && catData.length > 0) {
        const pet = catData.find((c) => c.id === p.catId);
        if (!pet?.age) return false;
        const petAge = String(pet.age).toLowerCase().trim();
        const searchAge = String(searchResults.age).toLowerCase().trim();
        if (petAge !== searchAge) return false;
      }
    }

    return true;
  });

  const searchResultPosts: Post[] =
    matchingSearchPosts && matchingSearchPosts.length > 0
      ? matchingSearchPosts
      : attributeFilteredSearchPosts;

  useEffect(() => {
    console.log('foundPetData', foundPetData);
    if (foundPetData.petType) {
      setActiveTab("found")
    }
  }, [foundPetData])

  // Switch to timeline tab if id query param is present
  useEffect(() => {
    if (postIdFromUrl) {
      setActiveTab("timeline");
    }
  }, [postIdFromUrl]);

  useEffect(() => {
    console.log('catdata insocil', catData);

  }, [catData])

  // Filter posts when filterState or posts change
  const filteredPosts = (() => {
    if (!filterState) {
      return posts;
    }

    return posts.filter((post) => {
      // Filter by 'My Posts' if active
      if (showMyPosts) {
        if (!user || !post.reportedBy || post.reportedBy.uid !== user.uid) {
          return false;
        }
      }

      // Filter by specific post ID if present in URL
      if (postIdFromUrl) {
        return post.id === postIdFromUrl || post.catId === postIdFromUrl;
      }

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
        (filterState.adoptionCheck && post.type === "adoption") ||
        (filterState.socialCheck && post.type === "social");

      // If all status checkboxes are unchecked, only show social posts if socialCheck is true
      if (!filterState.missingCatCheck && !filterState.foundCatCheck && !filterState.adoptionCheck) {
        return filterState.socialCheck && post.type === "social";
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
        <TabsList className="grid w-[70%] grid-cols-3 dark:bg-slate-800 dark:text-slate-100 ">
          <TabsTrigger value="timeline" className="cursor-pointer dark:data-[state=active]:bg-slate-700 dark:data-[state=inactive]:text-slate-400">Timeline</TabsTrigger>
          <TabsTrigger value="create" className="cursor-pointer dark:data-[state=active]:bg-slate-700 dark:data-[state=inactive]:text-slate-400">Create a Post</TabsTrigger>
          <TabsTrigger value="search" className="cursor-pointer dark:data-[state=active]:bg-slate-700 dark:data-[state=inactive]:text-slate-400">Search</TabsTrigger>
          {/* <TabsTrigger value="found">Report Found</TabsTrigger> */}
        </TabsList>

        <TabsContent value="timeline" className="mt-4 dark:bg-slate-900/50 p-2 rounded-lg">
          {/* Quick Create Post Buttons */}
          <div className="mb-4 flex gap-2 flex-wrap">
            <Button
              onClick={() => setActiveTab("create")}
              className="border justify-end border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg transition-colors text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            // className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              🐱 Create a Post
            </Button>
            <Button
              onClick={() => setShowMyPosts(!showMyPosts)}
              className={`border justify-end border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-lg transition-colors text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${showMyPosts ? 'bg-violet-100 dark:bg-violet-900/30 border-violet-500 dark:border-violet-500' : 'bg-white dark:bg-slate-800'}`}
            >
              👤 My Posts
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
                  {filterState && (filterState.missingCatCheck !== true || filterState.foundCatCheck !== true || filterState.adoptionCheck !== true || filterState.socialCheck !== true || filterState.petTypeFilter || filterState.colorFilter || filterState.ageFilter) && (
                    <div className="w-full mb-2 px-3 py-2 bg-violet-100 dark:bg-violet-900/30 border border-violet-300 dark:border-violet-700 rounded-lg text-sm">
                      <span className="text-violet-800 dark:text-violet-200">
                        🔍 Showing {filteredPosts.length} of {posts.length} posts
                      </span>
                    </div>
                  )}
                  {postIdFromUrl && (
                    <div className="w-full mb-2 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => router.push("/home")}
                        className="bg-white dark:bg-slate-800"
                      >
                        Show All Posts
                      </Button>
                    </div>
                  )}
                  {filteredPosts.map((p) => {
                    // Find petType from linked cat if not in post
                    // Ensure type safety by filtering out empty strings and invalid values
                    let petType: "cat" | "dog" | "other" | undefined = undefined;

                    // Check post petType first
                    if (p.petType && (p.petType === "cat" || p.petType === "dog" || p.petType === "other")) {
                      petType = p.petType;
                    }
                    // Fallback to linked pet if post doesn't have valid petType
                    else if (p.catId && catData.length > 0) {
                      const linkedPet = catData.find((c) => c.id === p.catId);
                      if (linkedPet?.petType && (linkedPet.petType === "cat" || linkedPet.petType === "dog" || linkedPet.petType === "other")) {
                        petType = linkedPet.petType;
                      }
                    }

                    return (
                      <PostCard
                        key={p.id}
                        postId={p.id}
                        title={p.title || "Untitled Post"}
                        imageUrl={p.imageUrl}
                        petType={petType}
                        post={p}
                        changeTabToCreate={changeTabToCreate}
                        catData={catData}
                        handleShowInMap={handleShowInMap}
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
                    Report a missing/found pet to start the timeline or post anything you want for your community!
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="create" className="mt-4 dark:bg-slate-900/50 p-4 rounded-lg">
          {/* Make only the create form scrollable and hide native scrollbars */}
          <div className="w-full max-h-[calc(100vh-13rem)] overflow-auto scrollbar-hide">
            <CreatePostForm
              onPostSuccess={() => setActiveTab("timeline")}
            />
          </div>
        </TabsContent>
         <TabsContent value="search" className="mt-4 dark:bg-slate-900/50 p-4 rounded-lg">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-13rem)]">
            {/* Search Form - Left Side */}
            <div className="lg:col-span-2 overflow-auto">
              <SearchPetForm onSearch={handleSearch} />
            </div>
            
            {/* Results - Right Side */}
            <div className="lg:col-span-2 overflow-auto">
              {searchResults ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                      Search Filters Applied
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {searchResults.animal && (
                        <div>
                          <p className="text-blue-700 dark:text-blue-300 font-medium">Type</p>
                          <p className="text-blue-900 dark:text-blue-100 capitalize">
                            {searchResults.animal}
                          </p>
                        </div>
                      )}
                      {searchResults.color && (
                        <div>
                          <p className="text-blue-700 dark:text-blue-300 font-medium">Color</p>
                          <p className="text-blue-900 dark:text-blue-100 capitalize">
                            {searchResults.color}
                          </p>
                        </div>
                      )}
                      {searchResults.age && (
                        <div>
                          <p className="text-blue-700 dark:text-blue-300 font-medium">Age</p>
                          <p className="text-blue-900 dark:text-blue-100 capitalize">
                            {searchResults.age}
                          </p>
                        </div>
                      )}
                      {searchResults.confidence && (
                        <div>
                          <p className="text-blue-700 dark:text-blue-300 font-medium">Confidence</p>
                          <p className="text-blue-900 dark:text-blue-100">
                            {Math.round(searchResults.confidence * 100)}%
                          </p>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSearchResults(null)}
                      className="mt-3 w-full dark:bg-slate-800"
                    >
                      Clear Search
                    </Button>
                  </div>

                  {/* Matching Posts */}
                  <div>
                    <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">
                      Similar Pets Found
                    </h3>
                    <div className="space-y-3">
                      {searchResultPosts.map((p) => {
                        let petType: "cat" | "dog" | "other" | undefined = undefined;
                        if (p.petType && (p.petType === "cat" || p.petType === "dog" || p.petType === "other")) {
                          petType = p.petType;
                        } else if (p.catId && catData.length > 0) {
                          const linkedPet = catData.find((c) => c.id === p.catId);
                          if (linkedPet?.petType && (linkedPet.petType === "cat" || linkedPet.petType === "dog" || linkedPet.petType === "other")) {
                            petType = linkedPet.petType;
                          }
                        }

                        return (
                          <PostCard
                            key={p.id}
                            postId={p.id}
                            title={p.title || "Untitled Post"}
                            imageUrl={p.imageUrl}
                            petType={petType}
                            post={p}
                            changeTabToCreate={changeTabToCreate}
                            catData={catData}
                            handleShowInMap={handleShowInMap}
                          />
                        );
                      })}
                    </div>
                    {searchResultPosts.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>No posts match your search criteria.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                  <p>similar posts will appear here</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="found" className="mt-4 dark:bg-slate-900/50 p-4 rounded-lg">
          <div className="w-full max-h-[calc(100vh-13rem)] overflow-auto scrollbar-hide">
            <FoundForm
              foundPetData={foundPetData}
              onPostSuccess={() => setActiveTab("timeline")}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function Social(props: SocialProps) {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div></div>}>
      <SocialContent {...props} />
    </Suspense>
  );
}