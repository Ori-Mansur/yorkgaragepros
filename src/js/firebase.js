// src/js/firebase.js

import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore, setLogLevel } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
    authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
    measurementId: import.meta.env.PUBLIC_FIREBASE_MEASUREMENT_ID
};

setLogLevel("error");

let app;
let db;
let storage;

if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);


    db = getFirestore(app);
    storage = getStorage(app);
}

export { app, db, storage };