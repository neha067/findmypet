/**
 * Backend Integration Service for Posts and Cats
 * Handles the integrated creation of posts and cats with proper relationships
 */

import { DocumentReference } from "firebase/firestore";
import { createCat, CreateCatData, PetStatus, PetType, getUserInfo } from "./petService";
import { 
  createPostWithAutoTitle, 
  PostType, 
  UserInfo 
} from "./postService";

export interface IntegratedPostData {
  postType: PostType;
  // Pet data (optional for social posts)
  petType?: PetType;  // REQUIRED for non-social posts: "cat" | "dog" | "other"
  name?: string;
  color?: string;
  gender?: "male" | "female" | "unknown";
  age?: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  missingDate?: Date;
  foundDate?: Date;
  missingMonth?: string;
  missingYear?: string;
  foundMonth?: string;
  foundYear?: string;
  imageUrl?: string;
  // User info
  user: any; // Firebase Auth user object
}

export interface IntegratedPostResult {
  postRef: DocumentReference;
  catRef?: DocumentReference; // Only for non-social posts
}

/**
 * Creates a post and optionally a cat document based on post type
 * - Social posts: Only creates a post (no cat document)
 * - Other post types: Creates both cat and post documents
 * 
 * @param data - Integrated post and cat data
 * @returns Promise resolving to created document references
 */
export async function createIntegratedPost(
  data: IntegratedPostData
): Promise<IntegratedPostResult> {
  const userInfo: UserInfo = getUserInfo(data.user);

  // Validate post type
  const validPostTypes: PostType[] = ["missing", "found", "adoption", "social"];
  if (!validPostTypes.includes(data.postType)) {
    throw new Error(`Invalid post type: ${data.postType}`);
  }

  // For social posts, only create a post (no cat document)
  if (data.postType === "social") {
    const postRef = await createPostWithAutoTitle(
      "social",
      {
        description: data.description,
        imageUrl: data.imageUrl,
        reportedBy: userInfo,
      }
    );

    return {
      postRef,
      // No catRef for social posts
    };
  }

  // For other post types, create both pet and post documents
  
  // Validate required fields for pet creation
  if (!data.petType) {
    throw new Error("Pet type is required for non-social posts");
  }

  if (!data.color) {
    throw new Error("Color is required for non-social posts");
  }

  if (!data.location) {
    throw new Error("Location is required for non-social posts");
  }

  // Default coordinates to Bangalore if not provided
  const lat = data.latitude ?? 12.9716;
  const lng = data.longitude ?? 77.5946;

  // Convert post type to pet status
  const petStatus: PetStatus = data.postType as PetStatus;

  // Determine relevant date
  const relevantDate = data.postType === "missing" || data.postType === "adoption"
    ? (data.missingDate || new Date())
    : (data.foundDate || new Date());

  // Create pet document
  const catData: CreateCatData = {
    petType: data.petType,
    status: petStatus,
    name: data.name,
    color: data.color,
    gender: data.gender || "unknown",
    age: data.age || "unknown",
    description: data.description,
    location: data.location,
    latitude: lat,
    longitude: lng,
    missingDate: data.postType === "missing" || data.postType === "adoption" 
      ? relevantDate 
      : undefined,
    foundDate: data.postType === "found" ? relevantDate : undefined,
    missingMonth: data.missingMonth,
    missingYear: data.missingYear,
    foundMonth: data.foundMonth,
    foundYear: data.foundYear,
    imageUrl: data.imageUrl,
    reportedBy: userInfo,
  };

  let catRef: DocumentReference;
  try {
    catRef = await createCat(catData);
  } catch (error: any) {
    throw new Error(`Failed to create pet document: ${error.message}`);
  }

  // Create post document linked to pet
  let postRef: DocumentReference;
  try {
    postRef = await createPostWithAutoTitle(
      data.postType,
      {
        name: data.name,
        color: data.color,
        description: data.description,
        imageUrl: data.imageUrl,
        catId: catRef.id,
        reportedBy: userInfo,
      }
    );
  } catch (error: any) {
    // If post creation fails, we've already created the pet
    // In production, you might want to delete the pet document here
    // For now, we'll just log the error
    console.error("Pet document created but post creation failed:", error);
    throw new Error(`Pet document created but failed to create post: ${error.message}`);
  }

  return {
    postRef,
    catRef,
  };
}

/**
 * Helper function to extract user info from Firebase Auth user
 */
export function getUserInfoFromAuth(user: any): UserInfo {
  return getUserInfo(user);
}

