"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  googleProvider,
  isFirebaseConfigured,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "./firebase";

const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthModalOpen: false,
  authModalMode: "signin",
  openAuthModal: () => {},
  closeAuthModal: () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logOut: async () => {},
  updateUserProfile: async () => {},
  resetUserPassword: async () => {},
  isFirebaseConfigured: false
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("signin"); // "signin" | "signup"

  // Listen to live Firebase authentication state
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email.split("@")[0],
            photoURL: firebaseUser.photoURL || null,
            provider: firebaseUser.providerData?.[0]?.providerId || "password",
            createdAt: firebaseUser.metadata?.creationTime
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, []);

  const openAuthModal = (mode = "signin") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Real Google Sign In via OAuth popup
  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      return { 
        success: false, 
        error: "Firebase configuration is missing in .env.local. Please provide your Firebase project keys." 
      };
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      setUser({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email.split("@")[0],
        photoURL: fbUser.photoURL || null,
        provider: "google.com",
        createdAt: fbUser.metadata?.creationTime
      });
      closeAuthModal();
      return { success: true };
    } catch (err) {
      console.error("Google sign in error:", err);
      return { success: false, error: err.message };
    }
  };

  // Real Email & Password Sign In
  const signInWithEmail = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      return { 
        success: false, 
        error: "Firebase configuration is missing in .env.local. Please provide your Firebase project keys." 
      };
    }
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = result.user;
      setUser({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email.split("@")[0],
        photoURL: fbUser.photoURL || null,
        provider: "password",
        createdAt: fbUser.metadata?.creationTime
      });
      closeAuthModal();
      return { success: true };
    } catch (err) {
      console.error("Email sign in error:", err);
      return { success: false, error: err.message };
    }
  };

  // Real Email & Password Registration
  const signUpWithEmail = async (email, password, displayName, avatarUrl) => {
    if (!isFirebaseConfigured || !auth) {
      return { 
        success: false, 
        error: "Firebase configuration is missing in .env.local. Please provide your Firebase project keys." 
      };
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = result.user;
      const initialAvatar = avatarUrl || null;
      await updateProfile(fbUser, {
        displayName: displayName || email.split("@")[0],
        photoURL: initialAvatar
      });
      setUser({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: displayName || email.split("@")[0],
        photoURL: initialAvatar,
        provider: "password",
        createdAt: new Date().toLocaleDateString()
      });
      closeAuthModal();
      return { success: true };
    } catch (err) {
      console.error("Email registration error:", err);
      return { success: false, error: err.message };
    }
  };

  // Real Sign Out
  const logOut = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Sign out error:", err);
      }
    }
    setUser(null);
  };

  // Real Profile Update
  const updateUserProfile = async ({ displayName, photoURL }) => {
    if (!user || !auth?.currentUser) {
      return { success: false, error: "No active user session found." };
    }
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName ?? user.displayName,
        photoURL: photoURL ?? user.photoURL
      });
      setUser((prev) => ({
        ...prev,
        displayName: displayName ?? prev.displayName,
        photoURL: photoURL ?? prev.photoURL
      }));
      return { success: true };
    } catch (err) {
      console.error("Profile update error:", err);
      return { success: false, error: err.message };
    }
  };

  // Real Password Reset
  const resetUserPassword = async (email) => {
    if (!isFirebaseConfigured || !auth) {
      return { 
        success: false, 
        error: "Firebase configuration is missing in .env.local." 
      };
    }
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err) {
      console.error("Password reset error:", err);
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logOut,
        updateUserProfile,
        resetUserPassword,
        isFirebaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
