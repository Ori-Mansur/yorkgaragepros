// This file assumes window.db (your Firestore instance) and window.storage (Firebase Storage) 
// has been initialized and exported by your local firebase.js file.
import { db, storage } from './firebase' // <-- ADJUSTED IMPORT: Added 'storage'
import { collection, addDoc, query, getDocs, orderBy, startAt, endAt, limit, serverTimestamp, where } from "firebase/firestore";

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
        sendNotificationEmail(collectionName, formData)

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
/**
 * Sends a notification email using the Firebase Trigger Email Extension.
 * This function creates a document in the 'mail' collection that the extension watches.
 * @param {string} subject - The subject line for the notification email.
 * @param {object} formData - The HTML body of the email.
 * @param {string[]} recipients - An array of email addresses to send the notification to (e.g., ["sales@yourdomain.com"]).
 * @returns {Promise<boolean>} True if the trigger document was successfully created.
 */
export async function sendNotificationEmail(subject, formData, recipients = 'orimansur@gmail.com') {
    if (!db) {
        console.error("Firestore is not initialized for email sending.");
        throw new Error("Firestore DB not initialized.");
    }
    const htmlContent = `
            <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px;">
                <h2 style="color: #003366;">New Booking Inquiry for York Garage Pros</h2>
                <p><strong>Action Required:</strong> Call this lead immediately!</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <tr><td style="padding: 5px; background-color: #f9f9f9; width: 30%;">
                    <strong>Name:</strong></td><td style="padding: 5px;">${formData.name}</td></tr>
                    <tr><td style="padding: 5px; background-color: #f9f9f9;">
                    <strong>Phone:</strong></td><td style="padding: 5px;"><a href="tel:${formData.phone}">${formData.phone}</a></td></tr>
                    <tr><td style="padding: 5px; background-color: #f9f9f9;">
                    <strong>Phone:</strong></td><td style="padding: 5px;"><a href="mailto:${formData.email}">${formData.email}</a></td></tr>
                    <tr><td style="padding: 5px; background-color: #f9f9f9;">
                    <strong>Service:</strong></td><td style="padding: 5px; font-weight: bold;">${formData.service}</td></tr>
                    <tr><td style="padding: 5px; background-color: #f9f9f9;">
                    <strong>Description:</strong></td><td style="padding: 5px;">${formData.notes}</td></tr>
                </table>
                

            </div>
        `;


    try {
        await addDoc(collection(db, "mail"), {
            // The extension requires 'to', 'cc', or 'bcc' fields
            to: recipients,

            // The email content
            message: {
                subject: subject,
                html: htmlContent,
            }
        });

        console.log("Email notification trigger document successfully created in 'mail' collection.");
        return true;

    } catch (e) {
        console.error("Error creating email trigger document: ", e);
        throw new Error(`Failed to send email notification trigger: ${e.message}`);
    }
}





export async function searchContacts({ search }) {
    if (!search || search.length < 2) return [];

    // 1. Setup the range for "starts with"
    // Using \uf8ff tells Firestore to find everything starting with the string
    const strSearch = search;
    const end = strSearch + '\uf8ff';

    try {
        // 2. Build both queries
        const contactsQuery = query(
            collection(db, "contacts"),
            orderBy("name"),
            where('name','>=',strSearch),
            limit(5)
        );

        const bookingsQuery = query(
            collection(db, "bookings"),
            orderBy("name"),
            where('name','>=',strSearch),
            limit(5)
        );

        // 3. Run them in parallel
        const dd = await getDocs(contactsQuery)
        console.log(dd);
        const [contactsSnap, bookingsSnap] = await Promise.all([
            getDocs(contactsQuery),
            getDocs(bookingsQuery)
        ]);
        

        // 4. Map the results
        const contacts = contactsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            sourceType: 'contact',
            icon: '👤'
        }));

        const bookings = bookingsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            sourceType: 'booking',
            icon: '📅'
        }));

        // 5. Merge and return
        return [...contacts, ...bookings];

    } catch (error) {
        console.error("Search error:", error);
        return [];
    }
}