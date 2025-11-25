import { useEffect, useState } from "react"
import CreatePost from "@/components/CreatePost";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PostCard from "@/components/PostCard";
import VisitCounter from "@/components/VisitCounter"
import { ScrollArea } from "@/components/ui/scroll-area"
import CreatePostForm from "./components/CreatePostForm";
import FoundForm from "./components/FoundForm"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
interface Post {
  id: string;
  title: string;
  likes?: number;
  createdAt?: any; // Firestore timestamp
}
const Social = () => {
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
    return(
     <>
     <div className="w-full">
        <div className="flex items-center space-x-4">
            <VisitCounter /> 
        </div> 
      <Tabs defaultValue="account">
             <TabsList>
               <TabsTrigger value="account">Timeline</TabsTrigger>
               <TabsTrigger value="password">Missing</TabsTrigger>
               <TabsTrigger value="found">Found</TabsTrigger>
             </TabsList>
             <TabsContent value="account" className="w-full justify-center">
               
               <div>
               
                <ScrollArea className="h-[480px] justify-center w-full rounded-md border p-4">     
                <div className="w-full flex justify-center flex-col gap-3">
                    {posts.length > 0 ? (
                        posts.map((p) => <PostCard key={p.id} postId={p.id} title={p.title} />)
                    ) : (
                        <p className="text-gray-500">No posts yet. Create one above!</p>
                    )} 
                </div>
                </ScrollArea>  
            </div>  
               
             </TabsContent>
             <TabsContent value="password">
              {/* <CreatePost onCreated={loadPosts} />  */}
              <CreatePostForm />
             </TabsContent>
              <TabsContent value="found">
              {/* <CreatePost onCreated={loadPosts} />  */}
              <FoundForm />
             </TabsContent>
           </Tabs>
        </div>
        
           
    </>
    )
}
export default Social;