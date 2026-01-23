<template>
  <div class="step-container animate-in">
    <h2 class="step-title">Design & Style</h2>
    <p class="step-sub">Personalize the look or upload a photo to skip selection.</p>

    <div class="form-group mb-xl">
      <label class="section-label">Upload your garage photo</label>
      <div :class="['upload-area', { 'success-border': modelValue.photoName }]">
        <input
          type="file"
          id="door-photo"
          hidden
          accept="image/*"
          @change="handleFileUpload"
        />
        <label for="door-photo" class="upload-label">
          <span class="icon-xl">{{ modelValue.photoName ? "✅" : "📸" }}</span>
          <span v-if="!modelValue.photoName" class="upload-text"
            >Tap to upload a photo of your house</span
          >
          <div v-else class="upload-success">
            <span class="success-text">{{ modelValue.photoName }}</span>
            <span class="skip-hint">Photo added! You can now skip to the next step.</span>
          </div>
        </label>
      </div>
    </div>

    <div class="divider"><span>OR SELECT MANUALLY</span></div>

    <div class="form-group mb-xl">
      <label class="section-label">Panel Style *</label>
      <div class="style-grid">
        <button
          type="button"
          v-for="style in filteredStyleOptions"
          :key="style.val"
          :class="['style-card', { active: modelValue.design === style.val }]"
          @click="updateField('design', style.val)"
        >
          <div class="style-img">
            <img :src="style.img" :alt="style.label" />
          </div>
          <span class="style-label">{{ style.label }}</span>
        </button>

        <button
          type="button"
          class="style-card full-width"
          :class="{ active: modelValue.design === 'not_sure' }"
          @click="updateField('design', 'not_sure')"
        >
          <span class="icon-md">💡</span>
          <span class="style-label">I'm Not Sure - Show me samples in person</span>
        </button>
      </div>
    </div>

    <div class="form-group mb-xl">
      <label class="section-label"
        >Exterior Color:
        <span class="highlight-text">{{ modelValue.colorName }}</span></label
      >
      <div class="color-swatch-grid">
        <button
          type="button"
          v-for="c in colorOptions"
          :key="c.name"
          :class="['color-btn-wrapper', { active: modelValue.colorName === c.name }]"
          @click="updateColor(c)"
        >
          <span class="color-swatch" :style="{ backgroundColor: c.color }"></span>
          <span class="color-name-label">{{ c.name }}</span>
        </button>
      </div>
    </div>

    <div class="form-group mb-xl">
      <label class="section-label">Windows</label>
      <div class="toggle-group mb-medium">
        <button
          type="button"
          :class="{ active: !modelValue.hasWindows }"
          @click="updateField('hasWindows', false)"
        >
          No Windows
        </button>
        <button
          type="button"
          :class="{ active: modelValue.hasWindows }"
          @click="updateField('hasWindows', true)"
        >
          Add Windows
        </button>
      </div>

      <div v-if="modelValue.hasWindows" class="window-options-box animate-in">
        <label class="section-label-sm">Window Insert Style</label>
        <div class="window-grid">
          <button
            type="button"
            v-for="win in windowStyles"
            :key="win"
            :class="['window-card', { active: modelValue.windowStyle === win }]"
            @click="updateField('windowStyle', win)"
          >
            <div class="window-placeholder">🔲</div>
            <span class="label-xs">{{ win }}</span>
          </button>
        </div>

        <div class="mt-large">
          <label class="section-label-sm">Glass Type</label>
          <div class="glass-toggle">
            <button
              type="button"
              v-for="g in glassStyles"
              :key="g"
              :class="['glass-btn', { active: modelValue.glassType === g }]"
              @click="updateField('glassType', g)"
            >
              {{ g }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
});

const emit = defineEmits(["update:modelValue"]);

const styleOptions = [
  { val: "flush", label: "Flush", img: "src/assets/doorTypes/flush-panels.webp" },
  {
    val: "long_ranch",
    label: "Long Ranch",
    img: "src/assets/doorTypes/long-ranch-panels.webp",
  },
  {
    val: "carriage",
    label: "Carriage",
    img: "src/assets/doorTypes/carriage-house-panels.webp",
  },
  { val: "ribbed", label: "Ribbed", img: "src/assets/doorTypes/ribbed-panels.webp" },
];

const filteredStyleOptions = computed(() => styleOptions);

const colorOptions = [
  { name: "White", color: "#FFFFFF" },
  { name: "Black", color: "#000000" },
  { name: "Brown", color: "#453020" },
  { name: "Wood Grain", color: "#4a2c1b" },
  { name: "Sandstone", color: "#a9a29a" },
  { name: "Dark Brown", color: "#322008" },
  { name: "Charcoal", color: "#4d4f4e" },
];

const windowStyles = [
  "Straight Stockbridge",
  "Stockton",
  "Arched Stockbridge",
  "Arched Stockton",
  "Waterton",
  "Cascade",
];
const glassStyles = ["Clear", "Frosted", "Tinted"];

const updateField = (field, value) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};

const updateColor = (colorObj) => {
  emit("update:modelValue", {
    ...props.modelValue,
    colorName: colorObj.name,
    colorHex: colorObj.color,
  });
};

const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    emit("update:modelValue", {
      ...props.modelValue,
      photoName: file.name,
      photoFile: file,
    });
  }
};
</script>

<style scoped>
/* Layout & Spacing */
.mb-xl {
  margin-bottom: 2.5rem;
}
.mb-medium {
  margin-bottom: 1rem;
}
.mt-large {
  margin-top: 1.5rem;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin-bottom: 2rem;
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 800;
}
.divider::before,
.divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid #e2e8f0;
}
.divider span {
  padding: 0 10px;
}

/* Upload Area Improvements */
.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  padding: 25px;
  text-align: center;
  background: #f8fafc;
  transition: 0.3s;
}
.success-border {
  border-color: #10b981;
  background: #f0fdf4;
}
.upload-label {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.icon-xl {
  font-size: 2rem;
}
.upload-text {
  font-weight: 600;
  color: #475569;
  font-size: 0.9rem;
}
.skip-hint {
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 700;
  display: block;
  margin-top: 4px;
}

/* Style Grid - Full Width Not Sure */
.style-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.style-card {
  border: 2px solid #f1f5f9;
  background: white;
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.style-card.full-width {
  grid-column: 1 / -1;
  flex-direction: row;
  justify-content: center;
  gap: 12px;
  padding: 18px;
}
.style-card.active {
  border-color: #e8a900;
  background: #fffdf5;
  box-shadow: 0 4px 12px rgba(232, 169, 0, 0.1);
}
.style-img {
  width: 100%;
  aspect-ratio: 16/10;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
  background: #f1f5f9;
}
.style-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.style-label {
  font-weight: 700;
  font-size: 0.85rem;
  color: #1c2a44;
}

/* Colors with Names */
.color-swatch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
}
.color-btn-wrapper {
  border: 2px solid #f1f5f9;
  background: white;
  border-radius: 10px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.color-btn-wrapper.active {
  border-color: #1c2a44;
  background: #f8fafc;
}
.color-swatch {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
}
.color-name-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: #475569;
  text-align: center;
}
.highlight-text {
  color: #e8a900;
  text-transform: none;
}

/* Windows UI Refinement */
.window-options-box {
  background: #f8fafc;
  padding: 15px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}
.window-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.window-card {
  padding: 8px;
  border: 2px solid #fff;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}
.window-card.active {
  border-color: #e8a900;
}
.window-placeholder {
  font-size: 1.2rem;
  margin-bottom: 4px;
  color: #cbd5e1;
}
.label-xs {
  font-size: 0.6rem;
  font-weight: 700;
  text-align: center;
  color: #1c2a44;
}

.glass-toggle {
  display: flex;
  gap: 4px;
  background: #e2e8f0;
  padding: 4px;
  border-radius: 10px;
}
.glass-btn {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.8rem;
}
.glass-btn.active {
  background: white;
  color: #1c2a44;
}
/* SHARED COMPONENT: Toggle Group (No Windows / Add Windows) */
.toggle-group {
  display: flex;
  background: #f1f5f9; /* Light grey track */
  padding: 5px;
  border-radius: 12px;
  gap: 5px;
  margin-bottom: 1rem;
}

.toggle-group button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  background: transparent;
  color: #64748b;
  transition: all 0.2s ease;
}

.toggle-group button.active {
  background: white;
  color: #1c2a44;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.toggle-group button:hover:not(.active) {
  background: rgba(255, 255, 255, 0.5);
}
</style>
