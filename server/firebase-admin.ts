// Firebase Admin SDK initialization
import admin from 'firebase-admin';

if (!process.env.VITE_FIREBASE_PROJECT_ID || !process.env.VITE_FIREBASE_API_KEY) {
  throw new Error('Missing Firebase configuration');
}

// Initialize Firebase Admin with minimal config
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

export const auth = admin.auth();
export default admin;
