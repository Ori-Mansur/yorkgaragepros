<template>
  <div class="step-container animate-in">
    <h2 class="step-title">Garage Details</h2>
    <p class="step-sub">Tell us about the opening and what you need.</p>

    <div class="form-group mb-xl">
      <label class="section-label">Service Type *</label>
      <div class="toggle-group-vertical">
        <button 
          type="button" 
          :class="['service-btn', { active: modelValue.ownDoor === 'No' }]"
          @click="updateField('ownDoor', 'No')"
        >
          <div class="btn-content">
            <span class="icon">📦</span>
            <div class="text-left">
              <span class="btn-title">I want to buy a door</span>
              <span class="btn-desc">Supply & Professional Installation</span>
            </div>
          </div>
        </button>

        <button 
          type="button" 
          :class="['service-btn', { active: modelValue.ownDoor === 'Yes' }]"
          @click="updateField('ownDoor', 'Yes')"
        >
          <div class="btn-content">
            <span class="icon">🛠️</span>
            <div class="text-left">
              <span class="btn-title">I have a door already</span>
              <span class="btn-desc">I just need installation service</span>
            </div>
          </div>
        </button>
      </div>
    </div>

    <div v-if="modelValue.ownDoor === 'No'" class="animate-in">
      <div class="form-group mb-large">
        <label class="section-label">Garage Width *</label>
        <div class="choice-grid">
          <button 
            type="button" 
            v-for="opt in widthOptions" :key="opt.val"
            :class="['choice-card', { active: modelValue.garageSize === opt.val }]"
            @click="updateField('garageSize', opt.val)"
          >
            <span class="icon-lg">{{ opt.icon }}</span>
            <span class="label-bold">{{ opt.label }}</span>
          </button>
        </div>
        <div v-if="modelValue.garageSize === 'Custom'" class="mt-small animate-in">
          <input 
            type="text" 
            v-model="modelValue.customWidth" 
            placeholder="e.g. 14ft 2in" 
            class="form-input-sm"
          />
        </div>
      </div>

      <div class="form-group mb-large">
        <label class="section-label">Door Height *</label>
        <div class="choice-grid">
          <button 
            type="button" 
            v-for="opt in heightOptions" :key="opt.val"
            :class="['choice-card', { active: modelValue.height === opt.val }]"
            @click="updateField('height', opt.val)"
          >
            <span class="icon-lg">{{ opt.icon }}</span>
            <span class="label-bold">{{ opt.label }}</span>
          </button>
        </div>
        <div v-if="modelValue.height === 'Custom'" class="mt-small animate-in">
          <input 
            type="text" 
            v-model="modelValue.customHeight" 
            placeholder="e.g. 9ft" 
            class="form-input-sm"
          />
        </div>
      </div>
    </div>

    <div class="measure-footer mt-xl">
      <button 
        type="button" 
        :class="['measure-link', { active: modelValue.needsMeasurement }]"
        @click="updateField('needsMeasurement', !modelValue.needsMeasurement)"
      >
        <span class="icon-sm">📏</span>
        {{ modelValue.needsMeasurement ? 'Measurement Requested' : 'I\'m not sure - Come measure for me' }}
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const widthOptions = [
  { val: 'Single', label: 'Single (8-9ft)', icon: '🚗' },
  { val: 'Double', label: 'Double (16ft)', icon: '🚙🚙' },
  { val: 'Custom', label: 'Custom', icon: '📏' }
];

const heightOptions = [
  { val: '7ft', label: '7\' Standard', icon: '🏠' },
  { val: '8ft', label: '8\' Tall', icon: '🏗️' },
  { val: 'Custom', label: 'Other', icon: '⏫' }
];

const updateField = (field, value) => {
  const updated = { ...props.modelValue, [field]: value };
  
  // Logic: If they have a door, clear specific dimensions to avoid data clutter
  if (field === 'ownDoor' && value === 'Yes') {
    updated.garageSize = '';
    updated.height = '';
  }
  
  emit('update:modelValue', updated);
};
</script>

<style scoped>
.service-btn {
  width: 100%;
  padding: 1.25rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.75rem;
}

.service-btn.active {
  border-color: #1c2a44;
  background: #f8fafc;
  box-shadow: 0 4px 12px rgba(28, 42, 68, 0.08);
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-title { display: block; font-weight: 800; color: #1c2a44; font-size: 1rem; }
.btn-desc { font-size: 0.8rem; color: #64748b; }

.choice-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.choice-card {
  padding: 1rem 0.5rem;
  background: #f8fafc;
  border: 2px solid #f1f5f9;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: 0.2s;
}

.choice-card.active {
  background: #fffdf5;
  border-color: #e8a900;
}

.measure-link {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
}

.measure-link.active {
  background: #e8a900;
  color: white;
  border-style: solid;
}

.form-input-sm {
  width: 100%;
  padding: 10px;
  border: 1px solid #e8a900;
  border-radius: 6px;
  background: #fffdf5;
}

.icon-lg { font-size: 1.4rem; margin-bottom: 4px; }
.label-bold { font-weight: 700; font-size: 0.75rem; color: #1c2a44; }
.mt-small { margin-top: 8px; }
.mb-large { margin-bottom: 1.5rem; }
.mb-xl { margin-bottom: 2rem; }
</style>