// correct code
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "../config/constants";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          // 1. Get the secure token from Firebase
          const idToken = await currentUser.getIdToken();

          // 2. Send it to your Django backend
          await fetch("http://127.0.0.1:8000/api/finance/auth-sync/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
          });
          console.log("User synced with Django database");
        } catch (err) {
          console.error("Failed to sync user with backend", err);
        }
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    setError("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      setIsGuest(false);
    } catch (err) {
      setError("Google Sign-in failed. Please try again.");
      console.error(err);
    }
  };

  const loginAsGuest = async () => {
    setError("");
    try {
      await signInAnonymously(auth);
      setIsGuest(true);
    } catch (err) {
      setError("Guest login failed.");
      console.error(err);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsGuest(false);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const value = {
    user,
    loading,
    isGuest,
    error,
    loginWithGoogle,
    loginAsGuest,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
