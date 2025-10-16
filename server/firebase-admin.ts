// Firebase Admin SDK initialization
import admin from 'firebase-admin';

// Trim whitespace from environment variables
const projectId = process.env.VITE_FIREBASE_PROJECT_ID?.trim();
const apiKey = process.env.VITE_FIREBASE_API_KEY?.trim();

if (!projectId || !apiKey) {
  throw new Error('Missing Firebase configuration');
}

// Initialize Firebase Admin with minimal config
if (!admin.apps.length) {
  admin.initializeApp({
    projectId,
  });
}

export const auth = admin.auth();
export default admin;
