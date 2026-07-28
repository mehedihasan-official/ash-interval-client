// Initializes and exports the Firebase app instance.
// Keys come from .env.local — never hardcode real keys here.
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === "string" && value.trim().length > 0,
);

let app: FirebaseApp | null = null;

if (isFirebaseConfigured) {
  // getApps()/getApp() guard avoids "Firebase app already initialized" errors
  // that Next.js hot-reload can otherwise trigger in development.
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export { isFirebaseConfigured };
export default app;
