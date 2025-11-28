/**
 * Backend Service for Post Operations
 * Handles all Firestore operations related to posts
 */

import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  DocumentReference,
  Firestore,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";

export type PostType = "missing" | "found" | "adoption" | "social";

export interface UserInfo {
  uid: string;
  name: string;
  email: string;
}

export interface CreatePostData {
  type: PostType;
  title: string;
  description?: string;
  imageUrl?: string;
  catId?: string; // Optional - only for missing/found/adoption posts
  reportedBy: UserInfo;
}

export interface PostDocument {
  id: string;
  type: PostType;
  title: string;
  description?: string;
  imageUrl?: string;
  catId?: string;
  reportedBy: UserInfo;
  createdAt: Timestamp;
  likeCount: number;
  updatedAt?: Timestamp;
}

/**
 * Validates post data before creation
 */
export function validatePostData(data: CreatePostData): { valid: boolean; error?: string } {
  if (!data.type) {
    return { valid: false, error: "Post type is required" };
  }

  const validTypes: PostType[] = ["missing", "found", "adoption", "social"];
  if (!validTypes.includes(data.type)) {
    return { valid: false, error: `Invalid post type. Must be one of: ${validTypes.join(", ")}` };
  }

  if (!data.title || data.title.trim().length === 0) {
    return { valid: false, error: "Post title is required" };
  }

  // For non-social posts, catId should be provided
  if (data.type !== "social" && !data.catId) {
    return { valid: false, error: `catId is required for ${data.type} posts` };
  }

  // For social posts, catId should NOT be provided
  if (data.type === "social" && data.catId) {
    return { valid: false, error: "Social posts should not have a catId" };
  }

  if (!data.reportedBy || !data.reportedBy.uid) {
    return { valid: false, error: "User information is required" };
  }

  return { valid: true };
}

/**
 * Generates a post title based on type and data
 */
export function generatePostTitle(
  type: PostType,
  data: { name?: string; color?: string; description?: string }
): string {
  switch (type) {
    case "missing":
      return data.name ? `Missing: ${data.name}` : "Missing Cat";
    case "found":
      return data.color ? `Found: ${data.color} cat` : "Found Cat";
    case "adoption":
      return data.name ? `Adoption: ${data.name}` : "Cat for Adoption";
    case "social":
      return data.description 
        ? (data.description.length > 50 
          ? data.description.substring(0, 50) + "..." 
          : data.description)
        : "Social Post";
    default:
      return "Post";
  }
}

/**
 * Creates a new post in Firestore
 * @param postData - Post data to create
 * @returns Promise resolving to the created post document reference
 */
export async function createPost(postData: CreatePostData): Promise<DocumentReference> {
  if (!db) {
    throw new Error("Firestore is not initialized. Check Firebase configuration.");
  }

  // Validate post data
  const validation = validatePostData(postData);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid post data");
  }

  try {
    const postsRef = collection(db, "posts");
    
    const postDocument = {
      type: postData.type,
      title: postData.title,
      description: postData.description || null,
      imageUrl: postData.imageUrl || null,
      catId: postData.catId || null,
      reportedBy: postData.reportedBy,
      createdAt: serverTimestamp(),
      likeCount: 0,
      updatedAt: serverTimestamp(),
    };

    // Remove null catId for social posts to keep database clean
    if (postData.type === "social") {
      delete (postDocument as any).catId;
    }

    const docRef = await addDoc(postsRef, postDocument);
    return docRef;
  } catch (error: any) {
    console.error("Error creating post:", error);
    throw new Error(`Failed to create post: ${error.message || "Unknown error"}`);
  }
}

/**
 * Helper function to create a post with automatic title generation
 */
export async function createPostWithAutoTitle(
  type: PostType,
  data: {
    name?: string;
    color?: string;
    description?: string;
    imageUrl?: string;
    catId?: string;
    reportedBy: UserInfo;
  }
): Promise<DocumentReference> {
  const title = generatePostTitle(type, data);
  
  return createPost({
    type,
    title,
    description: data.description,
    imageUrl: data.imageUrl,
    catId: data.catId,
    reportedBy: data.reportedBy,
  });
}

