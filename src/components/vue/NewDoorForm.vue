<template>
  <div class="quote-container">
    <div class="step-header">
      <div class="step-indicator">
        <div class="progress-line">
          <div class="progress-fill" :style="{ width: progressWidth }"></div>
        </div>
        <div v-for="step in totalSteps" :key="step" 
             :class="['step-dot', { active: currentStep >= step }]">
          {{ step }}
        </div>
      </div>
    </div>

    <div class="form-card">
      <form @submit.prevent="handleFinalSubmit">
        
        <div v-if="currentStep === 1">
          <GarageSizeStep v-model="formData.size" />
          <div class="action-area mt-xl">
            <button type="button" class="primary-btn" 
              :disabled="!isStep1Valid" 
              @click="goToStep(2)">
              Continue
            </button>
          </div>
        </div>

        <div v-if="currentStep === 2">
          <DoorStyleStep v-model="formData.style" />
          <div class="btn-group mt-xl">
            <button type="button" class="back-btn" @click="goToStep(1)">Back</button>
            <button type="button" class="primary-btn" @click="goToStep(3)">Next</button>
          </div>
        </div>

        <div v-if="currentStep === 3">
          <ProjectDetailsStep v-model="formData.project" />
          <div class="btn-group mt-xl">
            <button type="button" class="back-btn" @click="handleBackFromStep3">Back</button>
            <button type="button" class="primary-btn" 
              :disabled="!formData.project.postalCode" 
              @click="goToStep(4)">
              Next
            </button>
          </div>
        </div>

        <div v-if="currentStep === 4">
          <ContactStep v-model="formData.contact" :showError="showError" />
          <div class="btn-group mt-xl">
            <button type="button" class="back-btn" @click="goToStep(3)">Back</button>
            <button type="submit" class="submit-btn" :disabled="isSubmitting">
              {{ isSubmitting ? 'Sending...' : 'Get My Free Estimate' }}
            </button>
          </div>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import GarageSizeStep from './Form/GarageSizeStep.vue';
import DoorStyleStep from './Form/DoorStyleStep.vue';
import ProjectDetailsStep from './Form/ProjectDetailsStep.vue'; // Renamed from RepairDetailsStep
import ContactStep from './Form/ContactStep.vue';

const currentStep = ref(1);
const isSubmitting = ref(false);
const showError = ref(false);
const totalSteps = 4;

const formData = reactive({
  size: {
    ownDoor: 'No',
    garageSize: '',
    customWidth: '',
    height: '',
    customHeight: '',
    needsMeasurement: false
  },
  style: {
    design: 'not_sure',
    colorName: 'White',
    colorHex: '#FFFFFF',
    hasWindows: false,
    windowStyle: 'Stockton',
    glassType: 'Clear',
    photoName: '',
    photoFile: null
  },
  project: {
    urgency: 'standard',
    postalCode: '',
    description: ''
  },
  contact: {
    name: '',
    phone: '',
    email: ''
  }
});

const progressWidth = computed(() => {
  return ((currentStep.value - 1) / (totalSteps - 1)) * 100 + '%';
});

const isStep1Valid = computed(() => {
  if (formData.size.ownDoor === 'Yes') return true;
  if (formData.size.needsMeasurement) return true;
  return formData.size.garageSize && formData.size.height;
});

const goToStep = (step) => {
  // Logic: Skip Design (Step 2) if they already have a door
  if (step === 2 && formData.size.ownDoor === 'Yes') {
    currentStep.value = 3;
  } else {
    currentStep.value = step;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleBackFromStep3 = () => {
  if (formData.size.ownDoor === 'Yes') {
    currentStep.value = 1;
  } else {
    currentStep.value = 2;
  }
};

const handleFinalSubmit = async () => {
  if (!formData.contact.name || !formData.contact.email || !formData.contact.phone) {
    showError.value = true;
    return;
  }
  isSubmitting.value = true;
  
  // Simulation of your "Invitation Policy" - collecting info to serve them better
  console.log('Form Submitted:', formData);
  
  setTimeout(() => {
    isSubmitting.value = false;
    alert("Thank you! We've received your request.");
  }, 1500);
};
</script>

<style scoped>
.quote-container {
  max-width: 500px;
  margin: 2rem auto;
  padding: 0 15px;
  font-family: "Montserrat", sans-serif;
}

.form-card {
  background: white;
  padding: 2.5rem 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border-top: 6px solid #1c2a44;
}

.step-indicator {
  display: flex;
  justify-content: space-between;
  position: relative;
  max-width: 300px;
  margin: 0 auto 2.5rem;
}

.progress-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 3px;
  background: #e2e8f0;
  transform: translateY(-50%);
}

.progress-fill {
  height: 100%;
  background: #e8a900;
  transition: 0.3s;
}

.step-dot {
  position: relative;
  z-index: 2;
  width: 36px;
  height: 36px;
  background: white;
  border: 3px solid #e2e8f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #64748b;
}

.step-dot.active {
  border-color: #e8a900;
  background: #e8a900;
  color: white;
}

.primary-btn, .submit-btn {
  width: 100%;
  border: none;
  border-radius: 10px;
  font-weight: 800;
  padding: 18px;
  font-size: 1rem;
  cursor: pointer;
  transition: 0.2s;
}

.primary-btn { background: #1c2a44; color: white; }
.submit-btn { background: #e8a900; color: #1c2a44; }
.back-btn {
  flex: 0.4;
  background: #f1f5f9;
  color: #475569;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.btn-group { display: flex; gap: 12px; }
.mt-xl { margin-top: 2rem; }

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.animate-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

</style>