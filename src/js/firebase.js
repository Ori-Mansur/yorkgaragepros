// firebase.js
// This file initializes Firebase using client-side environment variables, 
// which Astro makes available via import.meta.env.

// Firebase Imports (Mandatory for Firestore)
import { initializeApp } from "firebase/app"; // Use package import instead of direct Gstatic URL
import { getAnalytics } from "firebase/analytics";
import {
    getFirestore, collection, addDoc, doc, setDoc,
    setLogLevel
} from "firebase/firestore";


// --- Astro Environment Variable Configuration ---
// Note: All client-side environment variables *must* be prefixed with "PUBLIC_" in Astro.
const firebaseConfig = {
    apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
    authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
    measurementId: import.meta.env.PUBLIC_FIREBASE_MEASUREMENT_ID
};
if (import.meta) {
    console.log(import.meta);
}
if (env) {
    console.log(env);
}
console.log(import.meta.env);


// Error check for configuration (optional, but good practice)
if (!firebaseConfig.apiKey) {
    console.error("FIREBASE CONFIGURATION MISSING: Ensure all PUBLIC_FIREBASE environment variables are set.");
    window.isAuthReady = true;
}

// Set Firestore log level to debug for better console feedback
setLogLevel('Debug');

// Global variables (Simplified for a standard Astro project)
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

if (firebaseConfig.apiKey) {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log(app);

    const analytics = getAnalytics(app);
    console.log(analytics);
    const db = getFirestore(app);
    window.db = db;
    console.log(db);

    // window.appId = firebaseConfig.appId;



} else {
    console.error("Firebase initialization skipped due to missing config.");
    // window.isAuthReady = true;
}