import { initializeApp, getApps, getApp, FirebaseOptions, FirebaseApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

const configSource = process.env.firebaseConfig as any;
let firebaseConfig: FirebaseOptions & { measurementId?: string } | undefined;

if (configSource) {
  if (typeof configSource === 'object' && configSource !== null) {
    firebaseConfig = configSource;
  } else if (typeof configSource === 'string') {
    try {
      firebaseConfig = JSON.parse(configSource);
    } catch (e) {
      console.error("Failed to parse firebase config from environment variable.", e);
    }
  }
}

const isConfigValid = !!(firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('PASTE_YOUR_'));

if (isConfigValid) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig!) : getApp();
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    if (firebaseConfig.measurementId) {
      getAnalytics(app);
    }
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
} else {
    console.warn("Firebase configuration is missing or invalid. Firebase features will be disabled.");
}

export const auth = authInstance;
export const db = dbInstance;

export const isFirebaseConfigured = () => {
  return isConfigValid && !!app;
};