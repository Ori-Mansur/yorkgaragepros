<template>
  <div class="quote-container">
    <div class="step-header">
      <div class="step-indicator">
        <div v-for="step in 3" :key="step" :class="['step-dot', { active: currentStep >= step }]">
          {{ step }}
        </div>
        <div class="progress-line">
          <div class="progress-fill" :style="{ width: ((currentStep - 1) / 2) * 100 + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="form-card">
      <form @submit.prevent="handleSubmit">
        
        <div v-if="currentStep === 1" class="form-step animate-in">
          <h2 class="step-title">What's the issue?</h2>
          <p class="step-sub">Select a category for your free quote.</p>
          <div class="service-grid">
            <button type="button" v-for="opt in serviceOptions" :key="opt.val"
              :class="['service-card', { active: formData.service === opt.val }]"
              @click="formData.service = opt.val">
              <span class="icon">{{ opt.icon }}</span>
              <span class="label">{{ opt.label }}</span>
            </button>
          </div>
          
          <div v-if="formData.service === 'NewDoorInstall'" class="form-group animate-in">
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
          <h2 class="step-title">Details & Photos</h2>
          <p class="step-sub">Postal code and photos help us give an accurate quote.</p>
          
          <div class="form-group">
            <label>Postal Code *</label>
            <input type="text" v-model="formData.postalCode" placeholder="L3X 2B1" class="form-input" @input="formData.postalCode = formData.postalCode.toUpperCase()" required />
          </div>

          <div class="form-group">
            <label>Additional Details</label>
            <textarea v-model="formData.notes" placeholder="Tell us more about the issue..." class="form-input" rows="2"></textarea>
          </div>

          <div class="form-group">
            <label>Upload Photos (Optional)</label>
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
            <button type="button" class="primary-btn" :disabled="!formData.postalCode" @click="nextStep">Next</button>
          </div>
        </div>

        <div v-if="currentStep === 3" class="form-step animate-in">
          <h2 class="step-title">Contact Info</h2>
          <div class="form-group"><label>Full Name *</label><input type="text" v-model="formData.name" placeholder="John Doe" class="form-input" required /></div>
          <div class="form-group"><label>Phone Number *</label><input type="tel" v-model="formData.phone" placeholder="(905) 555-0123" class="form-input" required /></div>
          <div class="form-group"><label>Email Address</label><input type="email" v-model="formData.email" placeholder="email@example.com" class="form-input" /></div>
          <div class="btn-group">
            <button type="button" class="back-btn" @click="currentStep--">Back</button>
            <button type="submit" class="submit-btn" :disabled="isSubmitting">{{ isSubmitting ? "Sending..." : "Get My Free Quote" }}</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { saveLeadToFirestore, uploadFilesToFirebase } from "/src/js/dbService.js";

const currentStep = ref(1);
const isSubmitting = ref(false);
const photoPreviews = ref([]);

const formData = reactive({
  service: "",
  garageSize: "",
  postalCode: "",
  notes: "",
  photos: [], 
  name: "",
  phone: "",
  email: "",
  source: "quickQuoteForm",
});

const serviceOptions = [
  { val: "BrokenSpring", label: "Broken Spring", icon: "💥" },
  { val: "StuckDoor", label: "Door Stuck", icon: "🔒" },
  { val: "OpenerRepair", label: "Opener Issue", icon: "⚙️" },
  { val: "NewDoorInstall", label: "New Door", icon: "🚪" },
  { val: "CableOff", label: "Off Track", icon: "🪢" },
  { val: "GeneralRepair", label: "Other Repair", icon: "🛠️" },
];

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

const nextStep = () => {
  currentStep.value++;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

async function handleSubmit() {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  
  try {
    let fileUrls = [];
    if (formData.photos.length > 0) {
      fileUrls = await uploadFilesToFirebase(formData.photos);
    }

    const leadData = {
      ...formData,
      fileUrls: fileUrls,
      fileCount: formData.photos.length,
    };
    
    // Clean up before saving to Firestore
    delete leadData.photos;

    const result = await saveLeadToFirestore("quote_requests", leadData, "quickQuoteForm");
    if (result.success) window.location.href = "/thank-you";
  } catch (e) { 
    console.error("Submission Error:", e);
    alert("Error sending request. Please try again."); 
  } finally { 
    isSubmitting.value = false; 
  }
}
</script>

<style scoped>
/* Keeping your exact styles from the BookingForm for consistency */
* { box-sizing: border-box; }
.quote-container { max-width: 450px; margin: 1rem auto; padding: 10px; font-family: "Montserrat", sans-serif; }
.step-dot.active { background: #E8A900; }
.progress-fill { background: #E8A900; height: 100%; transition: width 0.3s ease; }
.form-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); border-top: 4px solid #1C2A44; }
.step-title { font-size: 1.25rem; color: #1C2A44; margin: 0 0 0.5rem 0; font-weight: 800; }
.step-sub { font-size: 0.85rem; color: #343D46; margin-bottom: 1.5rem; opacity: 0.8; }
.preview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 15px; }
.preview-item { position: relative; aspect-ratio: 1/1; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0; }
.preview-img { width: 100%; height: 100%; object-fit: cover; }
.remove-btn { position: absolute; top: 2px; right: 2px; background: #1C2A44; color: white; border: none; border-radius: 50%; width: 18px; height: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; }
.step-header { padding: 0 10px; margin-bottom: 2rem; }
.step-indicator { display: flex; justify-content: space-between; align-items: center; position: relative; }
.step-dot { width: 32px; height: 32px; background: #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 2; color: white; font-weight: 700; font-size: 0.8rem; }
.progress-line { position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: #e2e8f0; z-index: 1; transform: translateY(-50%); }
.service-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 1.5rem; }
.service-card { padding: 20px; border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc; cursor: pointer; display: flex; flex-direction: column; align-items: center; }
.service-card.active { border-color: #E8A900; background: #fffdf5; box-shadow: inset 0 0 0 1px #E8A900; }
.service-card .label { font-size: 0.8rem; font-weight: 700; color: #1C2A44; margin-top: 4px; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 700; color: #1C2A44; margin-bottom: 4px; }
.form-input { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 16px; }
.upload-box { display: flex; flex-direction: column; align-items: center; border: 2px dashed #cbd5e1; padding: 20px; border-radius: 8px; cursor: pointer; background: #f8fafc; }
.btn-group { display: flex; gap: 8px; margin-top: 1.5rem; }
.primary-btn, .submit-btn { width: 100%; padding: 14px; border: none; border-radius: 4px; font-weight: 800; cursor: pointer; }
.primary-btn { background: #1C2A44; color: white; }
.submit-btn { background: #E8A900; color: #1C2A44; }
.back-btn { flex: 0.4; background: #f1f5f9; color: #343D46; border: none; padding: 14px; border-radius: 4px; font-weight: 600; cursor: pointer; }
.animate-in { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
</style>