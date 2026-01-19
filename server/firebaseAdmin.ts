import admin from 'firebase-admin';

// Initialize Firebase Admin SDK with service account credentials
// Credentials are loaded from environment variables for security
if (!admin.apps.length) {
  // Trim whitespace from all credentials to prevent mismatch errors
  const projectId = (process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID)?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    // Full service account credentials available - use cert auth
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    // Fallback: project ID only (limited functionality, may not verify tokens)
    console.warn('Firebase Admin: No service account credentials found. Token verification may fail.');
    admin.initializeApp({
      projectId,
    });
  }
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
