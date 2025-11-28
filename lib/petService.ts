/**
 * Backend Service for Pet Operations (formerly Cat Operations)
 * Handles all Firestore operations related to pets (cats, dogs, other animals)
 */

import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  DocumentReference,
  Firestore
} from "firebase/firestore";
import { db } from "./firebase";

export type PetStatus = "missing" | "found" | "adoption";
export type PetType = "cat" | "dog" | "other";

export interface UserInfo {
  uid: string;
  name: string;
  email: string;
}

export interface CreateCatData {
  petType: PetType;  // REQUIRED: Type of pet
  status: PetStatus;
  name?: string;
  color: string;
  gender?: "male" | "female" | "unknown";
  age?: string;
  description?: string;
  location: string;
  latitude: number;
  longitude: number;
  missingDate?: Date;
  foundDate?: Date;
  missingMonth?: string;
  missingYear?: string;
  foundMonth?: string;
  foundYear?: string;
  imageUrl?: string;
  reportedBy: UserInfo;
}

export interface CatDocument {
  id: string;
  petType: PetType;  // Type of pet
  name?: string;
  color: string;
  gender?: string;
  age?: string;
  status: PetStatus;
  description?: string;
  location: string;
  position: [number, number];
  latitude: number;
  longitude: number;
  missingDate?: Date;
  foundDate?: Date;
  missingMonth?: string;
  missingYear?: string;
  foundMonth?: string;
  foundYear?: string;
  imageUrl?: string;
  daysAgo: number;
  reportedBy: UserInfo;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  likeCount: number;
}

/**
 * Validates pet data before creation
 */
export function validateCatData(data: CreateCatData): { valid: boolean; error?: string } {
  if (!data.petType) {
    return { valid: false, error: "Pet type is required" };
  }

  const validPetTypes: PetType[] = ["cat", "dog", "other"];
  if (!validPetTypes.includes(data.petType)) {
    return { valid: false, error: `Invalid pet type. Must be one of: ${validPetTypes.join(", ")}` };
  }

  if (!data.status) {
    return { valid: false, error: "Pet status is required" };
  }

  const validStatuses: PetStatus[] = ["missing", "found", "adoption"];
  if (!validStatuses.includes(data.status)) {
    return { valid: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` };
  }

  if (!data.color || data.color.trim().length === 0) {
    return { valid: false, error: "Pet color/coat color is required" };
  }

  // Name is required for missing and adoption pets
  if ((data.status === "missing" || data.status === "adoption") && (!data.name || data.name.trim().length === 0)) {
    return { valid: false, error: "Pet name is required for missing and adoption pets" };
  }

  if (!data.location || data.location.trim().length === 0) {
    return { valid: false, error: "Location is required" };
  }

  if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
    return { valid: false, error: "Valid latitude and longitude are required" };
  }

  if (data.latitude < -90 || data.latitude > 90) {
    return { valid: false, error: "Latitude must be between -90 and 90" };
  }

  if (data.longitude < -180 || data.longitude > 180) {
    return { valid: false, error: "Longitude must be between -180 and 180" };
  }

  if (!data.reportedBy || !data.reportedBy.uid) {
    return { valid: false, error: "User information is required" };
  }

  return { valid: true };
}

/**
 * Calculates days ago from a given date
 */
export function calculateDaysAgo(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Creates a new pet document in Firestore
 * @param catData - Pet data to create
 * @returns Promise resolving to the created pet document reference
 */
export async function createCat(catData: CreateCatData): Promise<DocumentReference> {
  if (!db) {
    throw new Error("Firestore is not initialized. Check Firebase configuration.");
  }

  // Validate pet data
  const validation = validateCatData(catData);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid pet data");
  }

  try {
    const catsRef = collection(db, "cats");

    // Determine the relevant date for daysAgo calculation
    const relevantDate = catData.status === "missing" 
      ? (catData.missingDate || new Date())
      : (catData.foundDate || new Date());

    const daysAgo = calculateDaysAgo(relevantDate);

    const catDocument = {
      petType: catData.petType,
      name: catData.name || null,
      color: catData.color,
      gender: catData.gender || "unknown",
      age: catData.age || "unknown",
      status: catData.status,
      description: catData.description || null,
      location: catData.location,
      position: [catData.latitude, catData.longitude] as [number, number],
      latitude: catData.latitude,
      longitude: catData.longitude,
      missingDate: catData.missingDate || null,
      foundDate: catData.foundDate || null,
      missingMonth: catData.missingMonth || null,
      missingYear: catData.missingYear || null,
      foundMonth: catData.foundMonth || null,
      foundYear: catData.foundYear || null,
      imageUrl: catData.imageUrl || null,
      daysAgo: daysAgo,
      reportedBy: catData.reportedBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likeCount: 0,
    };

    // Remove null fields to keep database clean
    Object.keys(catDocument).forEach((key) => {
      if ((catDocument as any)[key] === null) {
        delete (catDocument as any)[key];
      }
    });

    const docRef = await addDoc(catsRef, catDocument);
    return docRef;
  } catch (error: any) {
    console.error("Error creating pet document:", error);
    throw new Error(`Failed to create pet document: ${error.message || "Unknown error"}`);
  }
}

/**
 * Helper to extract user info from Firebase Auth user
 */
export function getUserInfo(user: any): UserInfo {
  return {
    uid: user.uid,
    name: user.displayName || "Anonymous",
    email: user.email || "",
  };
}

