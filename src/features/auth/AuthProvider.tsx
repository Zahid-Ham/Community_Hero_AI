import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { UserProfile } from '../../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, city: string) => Promise<void>;
  loginAnonymously: (city?: string) => Promise<void>;
  updateUserCity: (city: string) => Promise<void>;
  clearError: () => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120"
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Helper to ensure a user document exists in firestore and returned as UserProfile
  const syncUserProfile = async (fbUser: User, extraData?: { name?: string; city?: string; isGuest?: boolean }) => {
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const now = new Date().toISOString();

      if (userDocSnap.exists()) {
        const currentData = userDocSnap.data();
        const updatedProfile: Partial<UserProfile> = {
          lastLogin: now,
          // Sync auth photo/name if user updated it
          name: currentData.name || fbUser.displayName || extraData?.name || "Civic Citizen",
          photoURL: currentData.photoURL || fbUser.photoURL || DEFAULT_AVATARS[0]
        };
        await updateDoc(userDocRef, updatedProfile);
        
        const mergedProfile = {
          ...currentData,
          ...updatedProfile,
          uid: fbUser.uid
        } as UserProfile;
        
        setUser(mergedProfile);
        return mergedProfile;
      } else {
        // Create new user profile document
        const isGuest = fbUser.isAnonymous || extraData?.isGuest || false;
        const newProfile: UserProfile = {
          uid: fbUser.uid,
          name: extraData?.name || fbUser.displayName || (isGuest ? "Guest Hero" : "Civic Citizen"),
          email: fbUser.email || (isGuest ? "guest@communityhero.in" : ""),
          photoURL: fbUser.photoURL || DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)],
          city: extraData?.city || "Mumbai",
          points: isGuest ? 10 : 25, // Give welcome points!
          badges: isGuest ? ["Guest Explorer"] : ["First Citizen"],
          reportsSubmitted: 0,
          reportsVerified: 0,
          createdAt: now,
          lastLogin: now,
          isGuest
        };

        await setDoc(userDocRef, newProfile);
        setUser(newProfile);
        return newProfile;
      }
    } catch (err: any) {
      console.error("Error syncing user profile in Firestore:", err);
      // Fallback local state if Firestore write/read fails (e.g. offline context)
      const offlineProfile: UserProfile = {
        uid: fbUser.uid,
        name: extraData?.name || fbUser.displayName || (fbUser.isAnonymous ? "Guest Hero" : "Civic Citizen"),
        email: fbUser.email || "",
        photoURL: fbUser.photoURL || DEFAULT_AVATARS[0],
        city: extraData?.city || "Mumbai",
        points: 25,
        badges: ["First Citizen"],
        reportsSubmitted: 0,
        reportsVerified: 0,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isGuest: fbUser.isAnonymous
      };
      setUser(offlineProfile);
      return offlineProfile;
    }
  };

  // Monitor firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await syncUserProfile(fbUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await syncUserProfile(result.user);
    } catch (err: any) {
      console.error("Google login failed:", err);
      setError(err.message || "Failed to authenticating with Google.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      await syncUserProfile(result.user);
    } catch (err: any) {
      console.error("Email login failed:", err);
      setError(err.message || "Invalid credentials. Please verify your email and password.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, city: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      // Wait to set display name on auth first
      await updateProfile(result.user, {
        displayName: name
      });
      await syncUserProfile(result.user, { name, city, isGuest: false });
    } catch (err: any) {
      console.error("Email signup failed:", err);
      setError(err.message || "Failed to create accounts.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginAnonymously = async (city: string = "Mumbai") => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInAnonymously(auth);
      await syncUserProfile(result.user, { name: "Guest Hero", city, isGuest: true });
    } catch (err: any) {
      console.error("Anonymous login failed:", err);
      setError(err.message || "Could not spin up guest session.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUserCity = async (city: string) => {
    if (!user || !firebaseUser) return;
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userDocRef, { city });
      setUser(prev => prev ? { ...prev, city } : null);
    } catch (err) {
      console.error("Could not update city:", err);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    error,
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    loginAnonymously,
    updateUserCity,
    clearError,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
