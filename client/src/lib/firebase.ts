// Firebase integration - referenced from firebase_barebones_javascript blueprint
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut, onAuthStateChanged, User } from "firebase/auth";

// Trim environment variables to remove any leading/trailing spaces
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();

const firebaseConfig = {
  apiKey,
  authDomain: `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket: `${projectId}.firebasestorage.app`,
  appId,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Detect if on mobile device
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const signInWithGoogle = async () => {
  try {
    // Use redirect for mobile devices (fixes Safari issues), popup for desktop
    if (isMobile()) {
      await signInWithRedirect(auth, googleProvider);
      return null; // Redirect will reload the page, so no user returned here
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Handle redirect result on page load (for mobile)
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.error("Error handling redirect result:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
