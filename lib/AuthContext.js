"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  googleProvider,
  isFirebaseConfigured,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "./firebase";
import { saveVerifiedSession, invalidateSession } from "./SessionManager";

const STORAGE_USER_KEY = "movieflix_user_session";

/**
 * Translates Firebase technical error codes into user-friendly messages.
 */
export function formatAuthError(err) {
  if (!err) return "An unexpected error occurred.";
  const msg = typeof err === "string" ? err : err.code || err.message || "";

  if (
    msg.includes("auth/invalid-credential") ||
    msg.includes("auth/wrong-password") ||
    msg.includes("auth/user-not-found") ||
    msg.includes("auth/invalid-login-credentials")
  ) {
    return "Incorrect email or password.";
  }
  if (msg.includes("auth/email-already-in-use")) {
    return "An account with this email address already exists.";
  }
  if (msg.includes("auth/invalid-email")) {
    return "Please enter a valid email address.";
  }
  if (msg.includes("auth/weak-password")) {
    return "Password is too weak. Please use at least 6 characters.";
  }
  if (msg.includes("auth/user-disabled")) {
    return "This account has been disabled. Please contact support.";
  }
  if (msg.includes("auth/too-many-requests")) {
    return "Too many failed attempts. Please try again later or reset your password.";
  }
  if (msg.includes("auth/popup-closed-by-user")) {
    return "Google sign-in was cancelled.";
  }
  if (msg.includes("auth/unauthorized-domain")) {
    return "Domain unauthorized in Firebase. Please add movieflix.stream to Firebase Console Authorized Domains.";
  }
  if (msg.includes("auth/network-request-failed")) {
    return "Network error. Please check your internet connection.";
  }

  return msg.replace(/^Firebase:\s*Error\s*\((.*?)\)\.?$/i, "$1") || "Authentication failed. Please try again.";
}

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

  // 1. Initial Load: Restore persistent local session immediately
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          setUser(parsed);
          saveVerifiedSession({ token: parsed.token || `mf_ses_${parsed.uid}` });
        }
      }
    } catch (_) {}

    // Check if returning from a Google redirect sign-in
    if (isFirebaseConfigured && auth) {
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            const fbUser = result.user;
            const userData = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || fbUser.email.split("@")[0],
              photoURL: fbUser.photoURL || null,
              provider: "google.com",
              createdAt: fbUser.metadata?.creationTime || new Date().toISOString(),
              token: `mf_google_${fbUser.uid}`
            };
            setUser(userData);
            try {
              localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData));
            } catch (_) {}
            saveVerifiedSession({ token: userData.token });
            closeAuthModal();
          }
        })
        .catch((e) => console.warn("getRedirectResult info:", e));
    }

    // 2. Listen to live Firebase authentication state
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email.split("@")[0],
            photoURL: firebaseUser.photoURL || null,
            provider: firebaseUser.providerData?.[0]?.providerId || "password",
            createdAt: firebaseUser.metadata?.creationTime || new Date().toISOString(),
            token: `mf_firebase_${firebaseUser.uid}`
          };
          setUser(userData);
          try {
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData));
          } catch (_) {}
          saveVerifiedSession({ token: userData.token });
        } else {
          // Keep local session if user explicitly logged in locally
          try {
            const stored = localStorage.getItem(STORAGE_USER_KEY);
            if (!stored) setUser(null);
          } catch (_) {
            setUser(null);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
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

  // Google Sign In via OAuth popup
  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      return { 
        success: false, 
        error: "Firebase configuration is missing in .env.local." 
      };
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const userData = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email.split("@")[0],
        photoURL: fbUser.photoURL || null,
        provider: "google.com",
        createdAt: fbUser.metadata?.creationTime || new Date().toISOString(),
        token: `mf_google_${fbUser.uid}`
      };
      setUser(userData);
      try {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData));
      } catch (_) {}
      saveVerifiedSession({ token: userData.token });
      closeAuthModal();
      return { success: true };
    } catch (err) {
      console.warn("Google sign-in popup error:", err);
      // If popup was blocked by browser, seamlessly fallback to redirect
      if (err?.code === "auth/popup-blocked" || String(err?.message || "").includes("popup-blocked")) {
        try {
          console.log("Popup blocked. Falling back to signInWithRedirect...");
          await signInWithRedirect(auth, googleProvider);
          return { success: true, redirecting: true };
        } catch (redirectErr) {
          console.error("signInWithRedirect error:", redirectErr);
          return { success: false, error: formatAuthError(redirectErr) };
        }
      }
      return { success: false, error: formatAuthError(err) };
    }
  };

  // Email & Password Sign In
  const signInWithEmail = async (email, password) => {
    if (!email || !password) {
      return { success: false, error: "Please enter both email and password." };
    }

    try {
      if (isFirebaseConfigured && auth) {
        try {
          const result = await signInWithEmailAndPassword(auth, email, password);
          const fbUser = result.user;
          const userData = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email.split("@")[0],
            photoURL: fbUser.photoURL || null,
            provider: "password",
            createdAt: fbUser.metadata?.creationTime || new Date().toISOString(),
            token: `mf_user_${fbUser.uid}`
          };
          setUser(userData);
          try {
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData));
          } catch (_) {}
          saveVerifiedSession({ token: userData.token });
          closeAuthModal();
          return { success: true };
        } catch (firebaseErr) {
          // All Firebase errors (wrong password, user not found, invalid credentials, etc.)
          // must be returned as failures — never silently fall through to a local session.
          return { success: false, error: formatAuthError(firebaseErr) };
        }
      } else {
        // Firebase is not configured — block sign-in and inform the user.
        return {
          success: false,
          error: "Authentication service is not configured. Please contact support."
        };
      }
    } catch (err) {
      console.error("Email sign in error:", err);
      return { success: false, error: formatAuthError(err) };
    }
  };

  // Email & Password Registration
  const signUpWithEmail = async (email, password, displayName, avatarUrl) => {
    if (!email || !password) {
      return { success: false, error: "Please provide an email and password." };
    }

    try {
      if (isFirebaseConfigured && auth) {
        try {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          const fbUser = result.user;
          const initialAvatar = avatarUrl || null;
          await updateProfile(fbUser, {
            displayName: displayName || email.split("@")[0],
            photoURL: initialAvatar
          });
          const userData = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: displayName || email.split("@")[0],
            photoURL: initialAvatar,
            provider: "password",
            createdAt: new Date().toISOString(),
            token: `mf_user_${fbUser.uid}`
          };
          setUser(userData);
          try {
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData));
          } catch (_) {}
          saveVerifiedSession({ token: userData.token });
          closeAuthModal();
          return { success: true };
        } catch (firebaseErr) {
          // All Firebase registration errors must be returned as failures.
          return { success: false, error: formatAuthError(firebaseErr) };
        }
      } else {
        // Firebase is not configured — block registration and inform the user.
        return {
          success: false,
          error: "Authentication service is not configured. Please contact support."
        };
      }
    } catch (err) {
      console.error("Email registration error:", err);
      return { success: false, error: formatAuthError(err) };
    }
  };

  // Sign Out
  const logOut = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Sign out error:", err);
      }
    }
    try {
      localStorage.removeItem(STORAGE_USER_KEY);
    } catch (_) {}
    invalidateSession();
    setUser(null);
  };

  // Profile Update
  const updateUserProfile = async ({ displayName, photoURL }) => {
    if (!user) {
      return { success: false, error: "No active user session found." };
    }
    try {
      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName ?? user.displayName,
          photoURL: photoURL ?? user.photoURL
        });
      }
      const updated = {
        ...user,
        displayName: displayName ?? user.displayName,
        photoURL: photoURL ?? user.photoURL
      };
      setUser(updated);
      try {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
      } catch (_) {}
      return { success: true };
    } catch (err) {
      console.error("Profile update error:", err);
      return { success: false, error: formatAuthError(err) };
    }
  };

  // Password Reset
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
      return { success: false, error: formatAuthError(err) };
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
