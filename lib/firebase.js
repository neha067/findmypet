import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase only if not already initialized
let app;
/** @type {import('firebase/firestore').Firestore | undefined} */
let db;
/** @type {import('firebase/auth').Auth | undefined} */
let auth;
/** @type {import('firebase/storage').FirebaseStorage | undefined} */
let storage;
/** @type {import('firebase/auth').GoogleAuthProvider | undefined} */
let provider;

try {
  // Check if Firebase is already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
  } else {
    // Check if config is valid
    const hasRequiredConfig = firebaseConfig.apiKey && 
      firebaseConfig.authDomain && 
      firebaseConfig.projectId;
    
    if (!hasRequiredConfig) {
      console.warn("⚠️ Firebase configuration is incomplete. Some features may not work.");
      console.warn("Required: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    } else {
      app = initializeApp(firebaseConfig);
    }
  }

  // Initialize Firebase services only if app is initialized
  if (app) {
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    provider = new GoogleAuthProvider();
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  if (process.env.NODE_ENV === 'development') {
    console.warn("Firebase config check:", {
      hasApiKey: !!firebaseConfig.apiKey,
      hasAuthDomain: !!firebaseConfig.authDomain,
      hasProjectId: !!firebaseConfig.projectId,
    });
  }
  // Don't throw - export undefined so components can handle it
}

// Helper functions with error handling
export const loginWithGoogle = async () => {
  if (!auth || !provider) {
    console.error("Firebase auth is not initialized");
    return;
  }
  try {
    await signInWithPopup(auth, provider)
  } catch (err) {
    console.error("Login error:", err)
    throw err;
  }
}

export const logout = async () => {
  if (!auth) {
    console.error("Firebase auth is not initialized");
    return;
  }
  try {
    await signOut(auth)
  } catch (err) {
    console.error("Logout error:", err)
    throw err;
  }
}

// Export services (will be undefined if Firebase failed to initialize)
export { db, auth, storage, provider };
