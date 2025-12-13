// This file assumes window.db (your Firestore instance) and window.storage (Firebase Storage) 
// has been initialized and exported by your local firebase.js file.
import { db, storage } from './firebase.js' // <-- ADJUSTED IMPORT: Added 'storage'
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "firebase/storage"; // <-- Added necessary Storage functions


// Max 5MB per file, useful to keep consistent with client-side validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; 

/**
 * Uploads an array of File objects to Firebase Storage.
 * @param {Array<File>} files - An array of File objects from the input field.
 * @param {string} collectionPath - The path within storage (e.g., 'booking_photos').
 * @returns {Promise<Array<string>>} A promise that resolves to an array of public download URLs.
 * @throws {Error} Throws an error if storage is not initialized or upload fails.
 */
export async function uploadFilesToFirebase(files, collectionPath = 'booking_photos') {
    if (!storage) {
        throw new Error("Firebase Storage is not initialized. Cannot upload files.");
    }
    if (!files || files.length === 0) {
        return [];
    }

    const uploadPromises = [];
    // Creates a unique, time-based folder for this submission (e.g., booking_photos/1734091200000)
    const uploadPath = `${collectionPath}/${Date.now()}`; 

    for (const file of files) {
        // Optional: Perform a server-side size check (though client-side exists)
        if (file.size > MAX_FILE_SIZE) {
             throw new Error(`File ${file.name} exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB size limit.`);
        }
        
        // 1. Create a unique file name and reference (e.g., UUID.jpg)
        const fileExtension = file.name.split('.').pop();
        // Use crypto.randomUUID for robust unique identification
        const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`; 
        const fileRef = ref(storage, `${uploadPath}/${uniqueFileName}`);

        // 2. Create the upload task and chain the download URL retrieval
        const uploadTask = uploadBytes(fileRef, file).then(snapshot => {
            return getDownloadURL(snapshot.ref);
        });

        uploadPromises.push(uploadTask);
    }

    try {
        // Wait for all upload promises to resolve and return the array of URLs
        const downloadUrls = await Promise.all(uploadPromises);
        console.log(`Successfully uploaded ${downloadUrls.length} file(s).`);
        return downloadUrls;
    } catch (error) {
        console.error("Error during file uploads to Firebase Storage:", error);
        // Re-throw the error to be caught by the calling Vue component's handleSubmit
        throw new Error("Failed to upload one or more files to storage.");
    }
}


/**
 * Saves a lead submission to the specified Firestore collection.
 * @param {string} collectionName - 'contacts' or 'bookings'
 * @param {object} formData - The lead data object
 * @param {string} source - The source form name ('contactForm', 'bookingForm')
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
            status: "New Lead", 
            source,
            userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: serverTimestamp() 
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