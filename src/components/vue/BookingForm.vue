<template>
  <div class="booking-container">
    <div class="step-header">
      <div class="step-indicator">
        <div v-for="step in 4" :key="step" :class="['step-dot', { active: currentStep >= step }]">
          {{ step }}
        </div>
        <div class="progress-line">
          <div class="progress-fill" :style="{ width: ((currentStep - 1) / 3) * 100 + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="form-card">
      <form @submit.prevent="handleSubmit">
        
        <div v-if="currentStep === 1" class="form-step animate-in">
          <h2 class="step-title">What's the issue?</h2>
          <p class="step-sub">Select a service category below.</p>
          <div class="service-grid">
            <button type="button" v-for="opt in serviceOptions" :key="opt.val"
              :class="['service-card', { active: formData.service === opt.val }]"
              @click="formData.service = opt.val">
              <span class="icon">{{ opt.icon }}</span>
              <span class="label">{{ opt.label }}</span>
            </button>
          </div>
          <div v-if="isGarageSizeRequired" class="form-group animate-in">
            <label>Garage Size *</label>
            <select v-model="formData.garageSize" class="form-input">
              <option value="1 Car">1 Car (Single)</option>
              <option value="2 Car">2 Car (Double)</option>
              <option value="3+ Car">3+ Car / Custom</option>
            </select>
          </div>
          <button type="button" class="primary-btn" :disabled="!formData.service" @click="nextStep">Continue</button>
        </div>

        <div v-if="currentStep === 2" class="form-step animate-in">
          <h2 class="step-title">Where & When?</h2>
          <div class="form-group">
            <label>Service Address *</label>
            <div class="gmp-wrapper">
              <gmp-place-autocomplete @gmp-select="onPlaceSelect" requested-region="CA"></gmp-place-autocomplete>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Preferred Date *</label>
              <input type="date" v-model="formData.date" :min="todayDate" class="form-input" required />
            </div>
            <div class="form-group">
              <label>Time Slot *</label>
              <select v-model="formData.time" class="form-input" required>
                <option v-for="slot in filteredTimeSlots" :key="slot.val" :value="slot.val">{{ slot.label }}</option>
              </select>
            </div>
          </div>
          <div class="btn-group">
            <button type="button" class="back-btn" @click="currentStep--">Back</button>
            <button type="button" class="primary-btn" :disabled="!formData.address" @click="nextStep">Next</button>
          </div>
        </div>

        <div v-if="currentStep === 3" class="form-step animate-in">
          <h2 class="step-title">Photos & Notes</h2>
          <p class="step-sub">Optional: Show us the issue so we arrive prepared.</p>
          
          <div class="form-group">
            <label>Additional Details</label>
            <textarea v-model="formData.notes" placeholder="E.g. Gate code, sounds motor is making..." class="form-input" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label>Upload Photos</label>
            <div class="upload-container">
              <input type="file" id="photo-upload" accept="image/*" multiple @change="handleFileUpload" hidden />
              <label for="photo-upload" class="upload-box">
                <span class="icon">📸</span>
                <span class="upload-text">Tap to add photos</span>
              </label>
            </div>

            <div v-if="photoPreviews.length > 0" class="preview-grid">
              <div v-for="(photo, idx) in photoPreviews" :key="photo.id" class="preview-item">
                <img :src="photo.url" class="preview-img" />
                <button type="button" @click="removePhoto(photo.id, idx)" class="remove-btn">×</button>
              </div>
            </div>
          </div>

          <div class="btn-group">
            <button type="button" class="back-btn" @click="currentStep--">Back</button>
            <button type="button" class="primary-btn" @click="nextStep">
              {{ formData.photos.length > 0 || formData.notes ? 'Continue' : 'Skip' }}
            </button>
          </div>
        </div>

        <div v-if="currentStep === 4" class="form-step animate-in">
          <h2 class="step-title">Contact Info</h2>
          <div class="form-group"><label>Full Name *</label><input type="text" v-model="formData.name" placeholder="John Doe" class="form-input" required /></div>
          <div class="form-group"><label>Phone Number *</label><input type="tel" v-model="formData.phone" @blur="savePartialLead" placeholder="(905) 555-0123" class="form-input" required /></div>
          <div class="form-group"><label>Email Address *</label><input type="email" v-model="formData.email" placeholder="email@example.com" class="form-input" required /></div>
          <div class="btn-group">
            <button type="button" class="back-btn" @click="currentStep--">Back</button>
            <button type="submit" class="submit-btn" :disabled="isSubmitting">{{ isSubmitting ? "Sending..." : "Confirm Booking" }}</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from "vue";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { saveLeadToFirestore, uploadFilesToFirebase } from "/src/js/dbService.js";

const currentStep = ref(1);
const isSubmitting = ref(false);
const todayDate = new Date().toISOString().split("T")[0];

const photoPreviews = ref([]);
const formData = reactive({
  service: "",
  garageSize: "",
  date: todayDate,
  time: "",
  notes: "",
  photos: [], 
  name: "",
  phone: "",
  email: "",
  address: "",
  source: "bookingForm",
});

const serviceOptions = [
  { val: "BrokenSpring", label: "Broken Spring", icon: "💥" },
  { val: "StuckDoor", label: "Door Stuck", icon: "🔒" },
  { val: "OpenerRepair", label: "Opener Issue", icon: "⚙️" },
  { val: "NewDoorInstall", label: "New Door", icon: "🚪" },
  { val: "CableOff", label: "Off Track", icon: "🪢" },
  { val: "GeneralTuneUp", label: "Maintenance", icon: "🛠️" },
];

// --- PHOTO LOGIC ---
const handleFileUpload = (e) => {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    const id = Math.random().toString(36).substr(2, 9);
    const url = URL.createObjectURL(file);
    photoPreviews.value.push({ id, url, file });
    formData.photos.push(file);
  });
  e.target.value = '';
};

const removePhoto = (id, index) => {
  URL.revokeObjectURL(photoPreviews.value[index].url);
  photoPreviews.value.splice(index, 1);
  formData.photos.splice(index, 1);
};

// --- TIME LOGIC ---
const filteredTimeSlots = computed(() => {
  const slots = [];
  const now = new Date();
  const bufferTime = new Date(now.getTime() + 30 * 60000);
  for (let hour = 8; hour <= 18; hour++) {
    for (let min of ["00", "30"]) {
      const hourStr = hour.toString().padStart(2, "0");
      const val = `${hourStr}:${min}`;
      if (formData.date === todayDate) {
        const slotTime = new Date();
        slotTime.setHours(hour, parseInt(min), 0, 0);
        if (slotTime < bufferTime) continue;
      }
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const ampm = hour >= 12 ? "PM" : "AM";
      slots.push({ val, label: `${displayHour}:${min} ${ampm}` });
    }
  }
  return slots;
});

watch(filteredTimeSlots, (newSlots) => {
  if (newSlots.length > 0 && (!formData.time || !newSlots.find((s) => s.val === formData.time))) {
    formData.time = newSlots[0].val;
  }
}, { immediate: true });

onMounted(async () => {
  const now = new Date();
  if (now.getHours() >= 16) {
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    formData.date = tomorrow.toISOString().split("T")[0];
  }
  const apiKey = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return;
  setOptions({ key: apiKey, version: "beta" });
  try { await importLibrary("places"); } catch (e) { console.error(e); }
});

const onPlaceSelect = async (event) => {
  const { placePrediction } = event;
  if (!placePrediction) return;
  try {
    const place = placePrediction.toPlace();
    await place.fetchFields({ fields: ["formattedAddress"] });
    formData.address = place.formattedAddress;
  } catch (error) { console.error(error); }
};

const nextStep = () => {
  currentStep.value++;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

async function savePartialLead() {
  if (formData.phone.length > 9) {
    await saveLeadToFirestore("partial_leads", { ...formData, status: "step4_reached" });
  }
}

async function handleSubmit() {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    // Note: You may need to upload formData.photos to Firebase Storage first 
    // and replace the array with the resulting URLs before this call.
    // if(formData.photos.length){

    // }
    console.log(formData);
    const fileUrls = await uploadFilesToFirebase(
      formData.photos
    );
    

    // Step 2: Prepare final lead data
    const leadData = {
      ...formData,
      fileUrls: fileUrls, // Add file URLs to the data payload
      fileCount: formData.photos.length,
    };
    delete leadData.photos
    const result = await saveLeadToFirestore("bookings", leadData, "bookingForm");
    if (result.success) window.location.href = "/thank-you/";
  } catch (e) { 
    console.error(e)
    alert("Error submitting booking."); 
  } 
  finally { isSubmitting.value = false; }
}

const isGarageSizeRequired = computed(() => formData.service === "NewDoorInstall");
</script>

<style scoped>
* { box-sizing: border-box; }
.booking-container { max-width: 450px; margin: 1rem auto; padding: 10px; font-family: "Montserrat", sans-serif; }

/* BRAND COLORS */
.step-dot.active { background: #E8A900; }
.progress-fill { background: #E8A900; }
.form-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); border-top: 4px solid #1C2A44; }
.step-title { font-size: 1.25rem; color: #1C2A44; margin: 0 0 0.5rem 0; font-weight: 800; }
.step-sub { font-size: 0.85rem; color: #343D46; margin-bottom: 1.5rem; opacity: 0.8; }

/* PHOTO PREVIEW GRID */
.preview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 15px; }
.preview-item { position: relative; aspect-ratio: 1/1; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0; }
.preview-img { width: 100%; height: 100%; object-fit: cover; }
.remove-btn { position: absolute; top: 2px; right: 2px; background: #1C2A44; color: white; border: none; border-radius: 50%; width: 18px; height: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; }

/* STEPS & UI */
.step-header { padding: 0 10px; margin-bottom: 2rem; }
.step-indicator { display: flex; justify-content: space-between; align-items: center; position: relative; }
.step-dot { width: 32px; height: 32px; background: #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 2; color: white; font-weight: 700; font-size: 0.8rem; }
.progress-line { position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: #e2e8f0; z-index: 1; transform: translateY(-50%); }
.progress-fill { height: 100%; transition: width 0.3s ease; }

.service-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 1.5rem; }
.service-card { padding: 20px; border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc; cursor: pointer; display: flex; flex-direction: column; align-items: center; transition: 0.2s; }
.service-card.active { border-color: #E8A900; background: #fffdf5; box-shadow: inset 0 0 0 1px #E8A900; }
.service-card .label { font-size: 0.8rem; font-weight: 700; color: #1C2A44; margin-top: 4px; text-align: center; }

.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 700; color: #1C2A44; margin-bottom: 4px; }
.form-input { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 16px; color: #343D46; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.upload-box { display: flex; flex-direction: column; align-items: center; border: 2px dashed #cbd5e1; padding: 20px; border-radius: 8px; cursor: pointer; background: #f8fafc; }
.upload-text { font-size: 0.8rem; font-weight: 700; color: #1C2A44; margin-top: 5px; }

.btn-group { display: flex; gap: 8px; margin-top: 1.5rem; }
.primary-btn, .submit-btn { width: 100%; padding: 14px; border: none; border-radius: 4px; font-weight: 800; cursor: pointer; font-size: 0.9rem; }
.primary-btn { background: #1C2A44; color: white; }
.submit-btn { background: #E8A900; color: #1C2A44; }
.back-btn { flex: 0.4; background: #f1f5f9; color: #343D46; border: none; padding: 14px; border-radius: 4px; font-weight: 600; cursor: pointer; }

.animate-in { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
</style>