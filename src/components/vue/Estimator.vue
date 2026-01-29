<template>
  <section class="estimator-section">
    <div class="estimator-container">
      <h2 class="estimator-title">Honest Labor Estimator</h2>
      <p class="estimator-subtitle">GTA Local • What you see is what you get.</p>

      <div class="estimator-card">
        <div class="form-grid">
          <div class="inputs-side">
            <div class="form-group">
              <label for="garage-size-select" class="form-label">Garage Size</label>
              <select id="garage-size-select" v-model="size" class="form-select">
                <option :value="1">1 Car (Single Door)</option>
                <option :value="2">2 Car (Double Door)</option>
                <option :value="3">3+ Car / Custom</option>
              </select>
            </div>

            <div class="form-group">
              <p class="form-label">Select Labor Services</p>

              <div
                class="checkbox-row"
                @click="toggleService('repair')"
                role="button"
                aria-pressed="selectedServices.includes('repair')"
              >
                <div
                  class="custom-checkbox"
                  :class="{ checked: selectedServices.includes('repair') }"
                >
                  <span v-if="selectedServices.includes('repair')">✓</span>
                </div>
                <div class="label-content">
                  <span class="service-name">Service Call & Labor</span>
                  <span class="service-price-hint">$250 Fixed Rate Labor</span>
                </div>
              </div>

              <div
                class="checkbox-row"
                @click="toggleService('opener')"
                role="button"
                aria-pressed="selectedServices.includes('opener')"
              >
                <div
                  class="custom-checkbox"
                  :class="{ checked: selectedServices.includes('opener') }"
                >
                  <span v-if="selectedServices.includes('opener')">✓</span>
                </div>
                <div class="label-content">
                  <span class="service-name">Opener Installation Labor</span>
                  <span class="service-price-hint">$300 per unit (Unit not incl.)</span>
                </div>
              </div>

              <div
                class="checkbox-row"
                @click="toggleService('door')"
                role="button"
                aria-pressed="selectedServices.includes('door')"
              >
                <div
                  class="custom-checkbox"
                  :class="{ checked: selectedServices.includes('door') }"
                >
                  <span v-if="selectedServices.includes('door')">✓</span>
                </div>
                <div class="label-content">
                  <span class="service-name">Door Installation Labor</span>
                  <span class="service-price-hint">$600 per door (Door not incl.)</span>
                </div>
              </div>
            </div>
          </div>

          <div class="results-side">
            <div class="estimate-box">
              <h3 class="estimate-label">TOTAL LABOR</h3>
              <p class="estimate-price">${{ totalPrice }}</p>

              <div class="price-tags">
                <span class="p-tag">✓ 1-Year Warranty</span>
                <span class="p-tag">✓ No "Bait & Switch"</span>
                <span class="p-tag">✓ GTA Local Pro</span>
              </div>

              <div class="value-breakdown">
                <ul class="breakdown-list">
                  <li v-if="selectedServices.includes('repair')">
                    Spring/Cable/Alignment Labor
                  </li>
                  <li v-if="selectedServices.includes('opener')">
                    Motor Mounting & Setup
                  </li>
                  <li v-if="selectedServices.includes('door')">
                    Full {{ size }}-Door Installation
                  </li>
                </ul>
              </div>

              <p class="transparency-note">*Labor estimate only. Parts quoted on-site.</p>
            </div>
          </div>
        </div>

        <div class="cta-container">
          <a href="tel:+19059609947" class="cta-link">
            <button class="cta-button-call">CALL LOCAL EXPERT</button>
          </a>
          <a href="/booking/" class="cta-link">
            <button class="cta-button-book">BOOK ON-SITE VISIT</button>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from "vue";

const size = ref(1);
const selectedServices = ref(["repair"]);

const PRICING = {
  repair: { base: 250, doubleSurcharge: 100 },
  opener: { base: 300 },
  door: { base: 600 },
};

const totalPrice = computed(() => {
  let total = 0;
  selectedServices.value.forEach((s) => {
    if (s === "repair") {
      total +=
        size.value > 1
          ? PRICING.repair.base + PRICING.repair.doubleSurcharge
          : PRICING.repair.base;
    } else {
      total += PRICING[s].base * size.value;
    }
  });
  return total.toLocaleString();
});

const toggleService = (key) => {
  const index = selectedServices.value.indexOf(key);
  if (index > -1) selectedServices.value.splice(index, 1);
  else selectedServices.value.push(key);
};
</script>

<style scoped>
.estimator-section {
  background: #f8fafc;
  padding: 3rem 1rem;
  font-family: sans-serif;
}
.estimator-container {
  max-width: 950px;
  margin: 0 auto;
}

.estimator-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 800;
  font-family: "Montserrat-ExtraBold", "Inter", sans-serif;
  color: #1c2a44;
  margin: 0;
}
.estimator-subtitle {
  text-align: center;
  color: #64748b;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.estimator-card {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-label {
  display: block;
  font-weight: 700;
  font-family: "Montserrat-Bold", "Inter", sans-serif;
  color: #1c2a44;
  margin-bottom: 0.5rem;
}
.form-select {
  width: 100%;
  padding: 0.8rem;
  border-radius: 8px;
  border: 2px solid #f1f5f9;
  margin-bottom: 1.5rem;
  font-size: 1rem;
  cursor: pointer;
}

.checkbox-row {
  display: flex;
  align-items: center;
  padding: 0.8rem;
  border: 2px solid #f1f5f9;
  border-radius: 10px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: 0.2s;
}
.checkbox-row:hover {
  border-color: #e8a900;
}

.custom-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #cbd5e1;
  border-radius: 4px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.custom-checkbox.checked {
  background: #1c2a44;
  border-color: #1c2a44;
}

.service-name {
  font-weight: 700;
  font-family: "Montserrat-Bold", "Inter", sans-serif;
  color: #1c2a44;
  font-size: 0.95rem;
}
.service-price-hint {
  font-size: 0.8rem;
  color: #94a3b8;
  display: block;
}

.estimate-box {
  background: #1c2a44;
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
}
.estimate-label {
  font-size: 0.8rem;
  letter-spacing: 1px;
  color: #e8a900;
  margin-bottom: 0;
}
.estimate-price {
  font-size: 3.5rem;
  font-weight: 900;
  font-family: "Montserrat-ExtraBold", "Inter", sans-serif;
  margin: 0.2rem 0;
  color: white;
}

.price-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-bottom: 1.2rem;
}
.p-tag {
  font-size: 0.7rem;
  background: rgba(232, 169, 0, 0.15);
  color: #e8a900;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-family: "Montserrat-Bold", "Inter", sans-serif;
  border: 1px solid rgba(232, 169, 0, 0.3);
}

.value-breakdown {
  text-align: left;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.8rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.breakdown-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.8rem;
  color: #cbd5e1;
}
.breakdown-list li {
  margin-bottom: 4px;
}
.breakdown-list li::before {
  content: "•";
  color: #e8a900;
  margin-right: 8px;
}

.transparency-note {
  font-size: 0.7rem;
  color: #94a3b8;
  font-style: italic;
}

.cta-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 2rem;
}
@media (max-width: 480px) {
  .cta-container {
    grid-template-columns: 1fr;
  }
}
.cta-link {
  text-decoration: none;
}
.cta-button-call {
  width: 100%;
  background: #e8a900;
  color: #1c2a44;
  border: none;
  padding: 1.2rem;
  border-radius: 10px;
  font-weight: 800;
  font-family: "Montserrat-ExtraBold", "Inter", sans-serif;
  cursor: pointer;
  transition: 0.3s;
}
.cta-button-book {
  width: 100%;
  background: #1c2a44;
  color: #e8a900;
  border: none;
  padding: 1.2rem;
  border-radius: 10px;
  font-weight: 800;
  font-family: "Montserrat-ExtraBold", "Inter", sans-serif;
  cursor: pointer;
  transition: 0.3s;
}
.cta-button-call:hover,
.cta-button-book:hover {
  filter: brightness(1.1);
}
</style>
