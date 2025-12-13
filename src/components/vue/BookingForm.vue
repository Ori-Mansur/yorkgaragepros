<template>
  <div class="booking-container">
    <div class="booking-left">
      <div>
        <h1>Book Your Slot</h1>
        <p>
          Secure your appointment with us easily. Please fill out the form to confirm your
          reservation and provide service location details.
        </p>
      </div>
      <div class="booking-left-footer">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="calendar-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <p>Confirmation sent via email.</p>
      </div>
    </div>

    <div class="booking-right">
      <form @submit.prevent="handleSubmit" id="bookingForm">
        <div class="form-group">
          <label for="service">Select Service <span class="required">*</span></label>
          <select id="service" v-model="formData.service" required class="form-input">
            <option value="">Choose a service...</option>
            <option value="NewDoorInstall">New Garage Door Installation</option>
            <option value="EmergencyRepair">Emergency Door Repair</option>
            <option value="FloorCoating">Epoxy Floor Coating</option>
          </select>
        </div>

        <div class="form-group">
          <label for="garageSize">
            Garage Size
            <span v-if="isGarageSizeRequired" class="required">*</span>
            <span v-else>(Optional for Repair)</span>
          </label>
          <select
            id="garageSize"
            v-model="formData.garageSize"
            :required="isGarageSizeRequired"
            class="form-input"
          >
            <option value="">Select size...</option>
            <option value="1 Car">1 Car (Single Door)</option>
            <option value="2 Car">2 Car (Standard Double)</option>
            <option value="3+ Car">3+ Car / Custom</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="date">Date <span class="required">*</span></label>
            <input
              type="date"
              id="date"
              v-model="formData.date"
              required
              class="form-input"
              :min="today"
            />
          </div>
          <div class="form-group">
            <label for="time">Time <span class="required">*</span></label>
            <input
              type="time"
              id="time"
              v-model="formData.time"
              required
              class="form-input"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="name">Full Name <span class="required">*</span></label>
            <input
              type="text"
              id="name"
              v-model="formData.name"
              placeholder="John Doe"
              required
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="phone">Phone Number <span class="required">*</span></label>
            <input
              type="tel"
              id="phone"
              v-model="formData.phone"
              placeholder="(555) 123-4567"
              required
              class="form-input"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="address">Service Address <span class="required">*</span></label>
          <input
            type="text"
            id="address"
            v-model="formData.address"
            placeholder="123 Main St, Anytown, ON"
            required
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="email">Email Address <span class="required">*</span></label>
          <input
            type="email"
            id="email"
            v-model="formData.email"
            placeholder="you@example.com"
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="photos">Upload Photos (Optional - Max 5MB per file)</label>
          <input
            type="file"
            id="photos"
            @change="handleFileSelect"
            accept="image/*"
            multiple
            class="form-input"
          />
        </div>

        <div v-if="selectedFilesArray.length > 0" class="image-preview-container">
          <div class="image-preview">
            <div
              v-for="(file, index) in selectedFilesArray"
              :key="index"
              class="image-preview-wrapper"
            >
              <img :src="file.previewUrl" :alt="file.name" />
              <button class="remove-btn" @click.prevent="removeImage(index)">X</button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="notes">Additional Notes (Optional)</label>
          <textarea
            id="notes"
            v-model="formData.notes"
            rows="3"
            class="form-input"
          ></textarea>
        </div>

        <div class="form-group">
          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            {{ isSubmitting ? "Processing..." : "Confirm Booking" }}
          </button>
          <a class="cancel" href="/"> Cancel </a>
        </div>

        <!-- <p v-if="message" :class="messageType">{{ message }}</p> -->
      </form>
    </div>
  </div>

  <div v-if="isMessageVisible" class="message-box">
    <div class="message-content">
      <h3 :class="messageType">{{ messageTitle }}</h3>
      <div v-html="messageContent"></div>
      <button @click="isMessageVisible = false">Close</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from "vue";
// Assuming saveLeadToFirestore handles the data submission to Firebase/backend
// You will need to import your Firebase setup and storage functions here for file uploads
import { saveLeadToFirestore, uploadFilesToFirebase } from "/src/js/dbService.js";
// NOTE: You will need to add file upload logic using Firebase Storage SDK here.

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Reactive State
const formData = reactive({
  service: "",
  garageSize: "",
  date: "",
  time: "",
  name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  source: "bookingForm",
});

const selectedFilesArray = ref([]);
const isSubmitting = ref(false);

// Custom Message Box State
const isMessageVisible = ref(false);
const messageTitle = ref("");
const messageContent = ref("");
const messageType = ref(""); // e.g., 'success', 'error'
const today = ref("");

// Computed Property for conditional validation/display
const isGarageSizeRequired = computed(() => {
  return formData.service === "NewDoorInstall" || formData.service === "FloorCoating";
});

// Watcher for conditional form fields (optional, but good practice)
// watch(() => formData.service, (newService) => {
//     if (!isGarageSizeRequired.value) {
//         formData.garageSize = ''; // Clear size if not needed
//     }
// });

// --- Methods ---

function showMessage(title, content, type = "info") {
  messageTitle.value = title;
  messageContent.value = content;
  messageType.value = type;
  isMessageVisible.value = true;
}

function removeImage(index) {
  selectedFilesArray.value.splice(index, 1);
}

function handleFileSelect(e) {
  console.log("handleFileSelect");

  const newFiles = Array.from(e.target.files);

  // Clear previous files and reset input to handle new selections correctly
  const newFilesData = [];
  // e.target.value = ''; // Allows the same file to be selected again if needed

  newFiles.forEach((file) => {
    if (newFilesData.length >= MAX_FILES) {
      showMessage(
        "File Limit Reached",
        `You can only upload a maximum of ${MAX_FILES} photos.`,
        "error"
      );
      return;
    }
    if (!file.type.startsWith("image/")) {
      showMessage("Invalid File Type", `File "${file.name}" is not an image.`, "error");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showMessage(
        "File Too Large",
        `File "${file.name}" exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`,
        "error"
      );
      return;
    }

    // Create a URL for previewing the image
    const previewUrl = URL.createObjectURL(file);
    newFilesData.push({
      file,
      previewUrl,
      name: file.name,
    });
  });
  selectedFilesArray.value = newFilesData;
  console.log("selectedFilesArray", selectedFilesArray.value);
}

// NOTE: This handleSubmit needs to be updated to include FILE UPLOADS
async function handleSubmit() {
  if (isSubmitting.value) return;

  // --- Vue-specific Validation ---
  if (isGarageSizeRequired.value && !formData.garageSize) {
    return showMessage("Error", "Please select a garage size for this service.", "error");
  }
  // Simple Vue Validation: Required fields check is often handled by the browser
  // using the 'required' attribute, but a final check is always good.
  if (
    !formData.service ||
    !formData.phone ||
    !formData.date ||
    !formData.time ||
    !formData.address ||
    !formData.email
  ) {
    return showMessage("Error", "Please fill in all required fields.", "error");
  }

  isSubmitting.value = true;

  try {
    // Step 1: Upload Files (Placeholder for actual Firebase Storage logic)
    const fileUrls = await uploadFilesToFirebase(
      selectedFilesArray.value.map((f) => f.file)
    );

    // Step 2: Prepare final lead data
    const leadData = {
      ...formData,
      fileUrls: fileUrls, // Add file URLs to the data payload
      fileCount: selectedFilesArray.value.length,
    };

    // Step 3: Save lead to Firestore
    const result = await saveLeadToFirestore("bookings", leadData, "bookingForm");

    if (result.success) {
      // Success Message Content
      let content = `Appointment: <strong>${leadData.service}</strong><br>
                           Date: ${leadData.date} at ${leadData.time}<br>
                           Address: ${leadData.address}<br>
                           We will call you at ${leadData.phone}.`;

      // Show confirmation modal
      showMessage("Booking Confirmed!", content, "success");

      // CRITICAL: Redirect for GA4 Conversion Tracking
      // window.location.href = '/thank-you/';

      // Clear state and form (if not redirecting)
      Object.keys(formData).forEach((key) => (formData[key] = ""));
      selectedFilesArray.value = [];
      
      window.location.href = '/thank-you/?form=booking';
    } else {
      showMessage(
        "Submission Error",
        `Failed to confirm booking: ${result.error}`,
        "error"
      );
    }
  } catch (error) {
    console.error("Booking submission error:", error);
    showMessage(
      "Critical Error",
      "An unexpected error occurred. Please call us directly.",
      "error"
    );
  } finally {
    isSubmitting.value = false;
  }
}

// Set minimum date to today on component mount
onMounted(() => {
    // window.location.href = '/thank-you/?form=booking';
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  today.value = `${yyyy}-${mm}-${dd}`;
  formData.date = today.value;
});

// onMounted(() => {
//     const today = new Date();
//     const yyyy = today.getFullYear();
//     const mm = String(today.getMonth() + 1).padStart(2, "0");
//     const dd = String(today.getDate()).padStart(2, "0");
//     formData.date = `${yyyy}-${mm}-${dd}`; // Set initial date to prevent empty required field
// });
</script>

<style scoped src="../../styles/booking.css" />
