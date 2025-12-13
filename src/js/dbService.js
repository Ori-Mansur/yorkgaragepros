// This file assumes window.db (your Firestore instance) has been initialized
// by your public/firebase.js file and window.isAuthReady is true.
import { db } from './firebase.js'
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Saves a lead submission to the specified Firestore collection.
 * * @param {string} collectionName - 'contacts' or 'bookings'
 * @param {object} formData - The lead data object
 * @returns {Promise<{success: boolean, id: string | null, error: string | null}>}
 */
export async function saveLeadToFirestore(collectionName, formData, source) {
    if (!db) {
        return {
            success: false,
            id: null,
            error: "Firestore is not initialized. Check firebase.js loading."
        };
    }

    try {
        const docRef = await addDoc(collection(db, collectionName), {
            ...formData,
            status: "New Lead", // Default status for lead management
            source,
            userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: serverTimestamp() // Use Firestore's time for accuracy
        });

        console.log(`Lead saved successfully in ${collectionName} with ID: ${docRef.id}`);
        return { success: true, id: docRef.id, error: null };

    } catch (e) {
        console.error("Error adding document to Firestore: ", e);
        return {
            success: false,
            id: null,
            error: `Failed to save lead: ${e.message}`
        };
    }
}