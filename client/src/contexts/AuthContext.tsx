import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, onAuthChange, signOut as firebaseSignOut, getIdToken, checkRedirectResult, type FirebaseUser } from '@/lib/firebase';
import type { User } from '@shared/schema';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncUserWithBackend = async (fbUser: FirebaseUser | null) => {
    if (!fbUser) {
      setUser(null);
      return;
    }

    try {
      const token = await fbUser.getIdToken();
      const response = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        console.error('Failed to sync user with backend');
        setUser(null);
      }
    } catch (error) {
      console.error('Error syncing user:', error);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      await syncUserWithBackend(firebaseUser);
    }
  };

  // Check for dev token and fetch user (development only)
  const checkDevToken = async () => {
    const devToken = localStorage.getItem('devToken');
    if (devToken) {
      try {
        const response = await fetch('/api/auth/user', {
          headers: { 'Authorization': `Bearer ${devToken}` },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          return true;
        } else {
          // Invalid dev token, clear it
          localStorage.removeItem('devToken');
        }
      } catch (error) {
        console.error('Dev token check failed:', error);
        localStorage.removeItem('devToken');
      }
    }
    return false;
  };

  useEffect(() => {
    const initAuth = async () => {
      // Check for dev token first (development only)
      const hasDevAuth = await checkDevToken();
      if (hasDevAuth) {
        setIsLoading(false);
        return;
      }

      // Check for redirect result on mount
      checkRedirectResult().then((user) => {
        if (user) {
          setFirebaseUser(user);
          syncUserWithBackend(user);
        }
      });
    };

    initAuth();

    const unsubscribe = onAuthChange(async (fbUser) => {
      // Skip Firebase auth if using dev token
      if (localStorage.getItem('devToken')) {
        return;
      }
      setFirebaseUser(fbUser);
      await syncUserWithBackend(fbUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    // Clear dev token if present
    localStorage.removeItem('devToken');
    await firebaseSignOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        isLoading,
        isAuthenticated: !!user,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
