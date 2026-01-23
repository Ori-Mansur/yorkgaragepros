<template>
  <div class="contact-step animate-in">
    <h2 class="step-title">Contact Information</h2>
    <p class="step-sub">Where should we send your estimate?</p>

    <div class="form-group">
      <label class="section-label">Full Name *</label>
      <div class="input-wrapper">
        <span class="input-icon">👤</span>
        <input 
          type="text" 
          v-model="internalValue.name" 
          placeholder="John Doe" 
          class="form-input"
          :class="{ 'input-error': showError && !internalValue.name }"
        />
      </div>
    </div>

    <div class="form-group mt-medium">
      <label class="section-label">Phone Number *</label>
      <div class="input-wrapper">
        <span class="input-icon">📞</span>
        <input 
          type="tel" 
          v-model="internalValue.phone" 
          placeholder="(555) 000-0000" 
          class="form-input"
          :class="{ 'input-error': showError && !isPhoneValid }"
        />
      </div>
    </div>

    <div class="form-group mt-medium">
      <label class="section-label">Email Address *</label>
      <div class="input-wrapper">
        <span class="input-icon">✉️</span>
        <input 
          type="email" 
          v-model="internalValue.email" 
          placeholder="john@example.com" 
          class="form-input"
          :class="{ 'input-error': showError && !isEmailValid }"
        />
      </div>
    </div>

    <p v-if="showError" class="error-text">Please fill in all fields correctly.</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  showError: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

// Sync internal state with parent v-model object
const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// Basic validation checks for UI feedback
const isEmailValid = computed(() => {
  return /^\s*[\w\-\+_]+(\.[\w\-\+_]+)*\@[\w\-\+_]+\.[\w\-\+_]+(\.[\w\-\+_]+)*\s*$/.test(internalValue.value.email);
});

const isPhoneValid = computed(() => {
  return internalValue.value.phone && internalValue.value.phone.length >= 10;
});
</script>

<style scoped>
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 15px;
  font-size: 1.2rem;
}

.form-input {
  width: 100%;
  padding: 16px 16px 16px 50px; /* Extra left padding for icon */
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #1c2a44;
}

.input-error {
  border-color: #dc2626 !important;
  background-color: #fef2f2;
}

.error-text {
  color: #dc2626;
  font-size: 0.85rem;
  font-weight: 700;
  margin-top: 1rem;
  text-align: center;
}

.section-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 800;
  color: #1c2a44;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mt-medium { margin-top: 1.2rem; }
</style>