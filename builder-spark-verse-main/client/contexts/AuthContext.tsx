import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  primaryPlatform?: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: string;
  usage: {
    [platform: string]: {
      used: number;
      limit: number;
      isPrimary: boolean;
    };
  };
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const createUserProfile = async (user: User, additionalData: any = {}) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const { displayName, email } = user;
      const createdAt = new Date().toISOString();

      const defaultUsage = {
        n8n: { used: 0, limit: 10, isPrimary: false },
        zapier: { used: 0, limit: 10, isPrimary: false },
        make: { used: 0, limit: 10, isPrimary: false },
        power_automate: { used: 0, limit: 10, isPrimary: false },
      };

      const userProfile: UserProfile = {
        uid: user.uid,
        email: email!,
        displayName: displayName || "",
        plan: "free",
        createdAt,
        usage: defaultUsage,
        ...additionalData,
      };

      try {
        await setDoc(userRef, userProfile);
        setUserProfile(userProfile);
      } catch (error) {
        console.error("Error creating user profile:", error);
      }
    } else {
      setUserProfile(userSnap.data() as UserProfile);
    }
  };

  const signup = async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    await updateProfile(user, { displayName });
    await createUserProfile(user, { displayName });

    // Redirect to onboarding for new users
    window.location.href = "/onboarding";
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const { user } = await signInWithPopup(auth, provider);
    await createUserProfile(user);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;

    const userRef = doc(db, "users", currentUser.uid);
    const updatedProfile = { ...userProfile, ...updates };

    await setDoc(userRef, updatedProfile, { merge: true });
    setUserProfile(updatedProfile);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Fetch user profile from Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserProfile(userSnap.data() as UserProfile);
        } else {
          await createUserProfile(user);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
