"use client";

// Provides authentication state (current user, role) and auth actions
// (login, Google login, create profile, sign out) to the whole app.
import { syncUserWithBackend } from "@/lib/api/users";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type Auth,
  type User,
} from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import firebaseApp, { isFirebaseConfigured } from "../firebase/firebase.config";

// Shape of the data collected on the Create Profile form.
interface ProfileData {
  membership: string;
  phone: string;
  userID: string;
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  createProfile: (
    data: ProfileData,
  ) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const auth: Auth | null =
  firebaseApp && isFirebaseConfigured ? getAuth(firebaseApp) : null;

const requireAuth = () => {
  if (!auth) {
    throw new Error(
      "Firebase authentication is not configured. Please set your Firebase environment variables.",
    );
  }
  return auth;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(auth));

  // Log in with email/password (the "Login ID" field maps to Firebase email).
  const login = async (email: string, password: string) => {
    const currentAuth = requireAuth();
    await signInWithEmailAndPassword(currentAuth, email, password);
  };

  // Log in (or sign up, Firebase treats both the same way) with Google.
  const googleLogin = async () => {
    const currentAuth = requireAuth();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(currentAuth, provider);
  };

  // Create a new profile using email/password, then store the display name
  // as the chosen userID so it shows up in Firebase's user record.
  const createProfile = async (data: ProfileData) => {
    try {
      const currentAuth = requireAuth();
      const result = await createUserWithEmailAndPassword(
        currentAuth,
        data.email,
        data.password,
      );
      await updateProfile(result.user, { displayName: data.userID });
      await syncUserWithBackend({
        name: data.userID,
        email: data.email,
      });
      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      return { success: false, message };
    }
  };

  const signOut = async () => {
    const currentAuth = requireAuth();
    await firebaseSignOut(currentAuth);
  };

  // Watches Firebase's auth state so `user` stays in sync across the app,
  // including on page refresh.
  useEffect(() => {
    if (!auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const syncAndSetAuthState = async () => {
        setUser(currentUser);

        if (currentUser?.email) {
          // Default to "user" immediately so role is never left stuck on
          // the previous session's value while the backend sync below is
          // still in flight; it's upgraded to "admin" if the synced record
          // says so.
          setRole("user");
          try {
            const backendUser = await syncUserWithBackend({
              name: currentUser.displayName ?? "",
              email: currentUser.email,
            });
            setRole(backendUser.isAdmin ? "admin" : "user");
          } catch (error) {
            // Firebase auth should remain usable if the API is temporarily down.
            console.error(
              "Could not sync authenticated user with backend:",
              error,
            );
          }
        } else {
          setRole(null);
        }

        setLoading(false);
      };

      void syncAndSetAuthState();
    });
    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    role,
    loading,
    login,
    googleLogin,
    createProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Convenience hook so components can call useAuth() instead of
// useContext(AuthContext) + null-checking every time.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
