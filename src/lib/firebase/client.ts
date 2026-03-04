import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  type Firestore,
  enableMultiTabIndexedDbPersistence,
} from "firebase/firestore";

// IMPORTANT: Ensure you have a .env.local file in the root of your project
// with your Firebase configuration variables.
// These variables MUST be prefixed with NEXT_PUBLIC_ to be available on the client-side.
// You can find these values in your Firebase project console:
// Project Settings > General tab > Your apps > Web app > SDK setup and configuration (select Config).
//
// Example .env.local content:
// NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
// NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef...
// NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX (Optional for Analytics)

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// --- Configuration Validation ---
const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
const missingConfigKeys = requiredKeys
  .filter((key) => !(firebaseConfig as Record<string, any>)[key])
  .map(
    (key) =>
      `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, "_$1").toUpperCase()}`,
  );

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (missingConfigKeys.length > 0) {
  console.error(
    `\n--- FIREBASE CONFIGURATION ERROR ---` +
      `\nFirebase initialization failed due to missing or incomplete environment variables.` +
      `\nPlease ensure the following environment variables are correctly set in your .env.local file:` +
      `\n${missingConfigKeys.join("\n")}` +
      `\n---------------------------------------\n`,
  );
} else {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    auth = getAuth(app);
    db = getFirestore(app);

    // --- Enable Offline Persistence ---
    if (typeof window !== "undefined" && db) {
      enableMultiTabIndexedDbPersistence(db).catch((err) => {
        if (err.code === "failed-precondition") {
          // Multiple tabs open, persistence can only be enabled in one tab at a time.
          console.warn("Firestore persistence failed: Multiple tabs open");
        } else if (err.code === "unimplemented") {
          // The current browser does not support all of the features required to enable persistence
          console.warn("Firestore persistence failed: Browser not supported");
        }
      });
    }
  } catch (error: any) {
    console.error(`\n--- FIREBASE INITIALIZATION FAILED ---: ${error.message}`);
    app = null;
    auth = null;
    db = null;
  }
}

export { app, auth, db };
