<template>
  <div class="step-container animate-in">
    <h2 class="step-title">Repair Details</h2>
    <p class="step-sub">Help us prioritize your service request.</p>

    <div class="form-group mb-xl">
      <label class="section-label">How urgent is this? *</label>
      <div class="urgency-grid">
        <button 
          type="button" 
          v-for="opt in urgencyOptions" :key="opt.val"
          :class="['urgency-card', { active: modelValue.urgency === opt.val }]"
          @click="updateField('urgency', opt.val)"
        >
          <span class="urgency-icon">{{ opt.icon }}</span>
          <div class="text-left">
            <span class="label-bold">{{ opt.label }}</span>
            <span class="label-hint">{{ opt.desc }}</span>
          </div>
        </button>
      </div>
    </div>

    <div class="form-group mb-xl">
      <label class="section-label">Service Location *</label>
      <div class="input-wrapper">
        <span class="input-icon">📍</span>
        <input 
          type="text" 
          v-model="internalPostal"
          placeholder="L3X 2B1" 
          class="form-input"
          maxlength="7"
          @input="handlePostalInput"
        />
      </div>
      <p class="helper-text">Enter your postal code to check availability.</p>
    </div>

    <div class="form-group">
      <label class="section-label">What happened? (Optional)</label>
      <textarea 
        v-model="internalDescription"
        @input="updateField('description', $event.target.value)"
        placeholder="E.g. Broken spring, door won't open, cable snapped..." 
        class="form-textarea"
        rows="4"
      ></textarea>
      <div class="quick-tags mt-small">
        <button 
          type="button" 
          v-for="tag in commonIssues" :key="tag"
          class="tag-btn"
          @click="appendTag(tag)"
        >
          + {{ tag }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Object, required: true }
});

const emit = defineEmits(['update:modelValue']);

const urgencyOptions = [
  { val: 'emergency', label: 'Emergency', desc: 'Car stuck / Security risk', icon: '🚨' },
  { val: 'standard', label: 'Standard', desc: 'Next available slot', icon: '📅' },
  { val: 'flexible', label: 'Flexible', desc: 'Sometime this week', icon: '🙂' }
];

const commonIssues = ['Broken Spring', 'Noisy Door', 'Off Track', 'Remote Issue'];

const internalPostal = computed({
  get: () => props.modelValue.postalCode,
  set: (val) => updateField('postalCode', val.toUpperCase())
});

const internalDescription = computed({
  get: () => props.modelValue.description,
  set: (val) => updateField('description', val)
});

const updateField = (field, value) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value });
};

const handlePostalInput = (e) => {
  let val = e.target.value.toUpperCase().replace(/\s/g, '');
  if (val.length > 3 && val.charAt(3) !== ' ') {
    val = val.slice(0, 3) + ' ' + val.slice(3);
  }
  updateField('postalCode', val);
};

const appendTag = (tag) => {
  const current = props.modelValue.description || '';
  const newValue = current ? `${current}, ${tag}` : tag;
  updateField('description', newValue);
};
</script>

<style scoped>
.urgency-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.urgency-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 1rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.urgency-card.active {
  border-color: #dc2626; /* Red for repair urgency */
  background: #fffafa;
}

.urgency-icon { font-size: 1.5rem; }

.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 15px; }

.form-input {
  width: 100%;
  padding: 14px 14px 14px 45px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
}

.form-textarea {
  width: 100%;
  padding: 14px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-family: inherit;
  resize: none;
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-btn {
  background: #f1f5f9;
  border: none;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}

.tag-btn:hover { background: #e2e8f0; }

.label-hint { font-size: 0.75rem; color: #64748b; display: block; }
.helper-text { font-size: 0.75rem; color: #94a3b8; margin-top: 5px; }
</style>