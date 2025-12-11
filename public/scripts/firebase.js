// Firebase Imports(Mandatory for Firestore)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Set Firestore log level to debug for better console feedback
setLogLevel('Debug');

// Global variables (from Canvas environment)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

if (Object.keys(firebaseConfig).length > 0) {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    window.db = getFirestore(app);
    window.auth = getAuth(app);
    window.appId = appId;
    window.isAuthReady = false;

    // Persist authentication state locally
    setPersistence(window.auth, browserLocalPersistence)
        .then(() => {
            // Sign in with custom token if available, otherwise anonymously
            if (initialAuthToken) {
                return signInWithCustomToken(window.auth, initialAuthToken);
            } else {
                return signInAnonymously(window.auth);
            }
        })
        .catch((error) => {
            console.error("Firebase Auth Error:", error);
            // Fallback to anonymous sign-in if custom token fails
            signInAnonymously(window.auth).catch(e => console.error("Anonymous Sign-in Failed:", e));
        });

    // Auth state observer
    onAuthStateChanged(window.auth, (user) => {
        if (user) {
            window.userId = user.uid;
            window.isAuthReady = true;
            console.log("Firestore initialized. User ID:", window.userId);
            // Call initial functions that depend on auth/db setup here if needed
        } else {
            console.warn("User is signed out or auth is not complete.");
            // We keep isAuthReady=false if signed out until the anonymous sign-in completes
        }
    });
} else {
    console.error("Firebase configuration is missing. Forms will not submit.");
    window.isAuthReady = true; // Mark ready to avoid infinite loading, but log error
}
