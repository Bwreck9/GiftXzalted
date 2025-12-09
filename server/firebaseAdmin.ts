import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// In production, this uses the service account credentials
// For now, we use the project ID from environment
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

export const firebaseAuth = admin.auth();

export async function verifyFirebaseToken(idToken: string) {
  try {
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
}
