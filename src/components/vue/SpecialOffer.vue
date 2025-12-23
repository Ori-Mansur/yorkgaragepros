<template>
  <div class="offer-container">
    <h1 class="offer-title">{{ currentOffer.title }}</h1>
    <div class="offer-badge">{{ currentOffer.badge }}</div>

    <div v-if="isTimerActive" class="countdown-wrap">
      <p class="timer-label">Offer ends in:</p>
      <div class="countdown-grid">
        <div v-for="(val, unit) in timeLeft" :key="unit" class="countdown-box">
          <span class="countdown-value">{{ val }}</span>
          <span class="countdown-label">{{ unit }}</span>
        </div>
      </div>
    </div>

    <div class="price-display">
      <p class="price-label">Your Guaranteed Price:</p>
      <div class="price-amount">{{ currentOffer.price }}</div>
      <p class="price-subtitle">{{ currentOffer.priceNote }}</p>
    </div>

    <div v-if="currentOffer.hasCode" class="interactive-zone">
      <div v-if="!revealed">
        <button @click="revealed = true" class="reveal-button">REVEAL PROMO CODE</button>
      </div>
      <div v-else class="success-box animate-pop">
        <div class="promo-code">{{ currentOffer.code }}</div>
        <p class="mention-text">Mention this code when you call.</p>
      </div>
    </div>

    <a href="tel:+19059609947" class="cta-button">
      <span class="phone-icon">📞</span> CALL FOR SAME-DAY REPAIR
    </a>

    <div class="offer-details">
      <div class="detail-item">
        <span>✓</span> <strong>Service Area:</strong> York Region & Simcoe County
      </div>
      <div class="detail-item">
        <span>✓</span> <strong>Parts:</strong> High-Cycle Torsion Springs
      </div>
      <div class="detail-item">
        <span>✓</span> <strong>Reliability:</strong> 5-Star Rated Local Tech
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";

const revealed = ref(false);

const deals = {
  "boxing-day": {
    title: "Boxing Day Special",
    badge: "EXCLUSIVE HOLIDAY RATE",
    price: "$225.25",
    priceNote: "Total All-Inclusive Flat Rate",
    code: "BOXING225",
    hasCode: true,
    endDate: "2025-12-26T23:59:59",
  },
  // FALLBACK / GENERIC OFFER
  default: {
    title: "York Region Pros",
    badge: "EVERYDAY LOCAL VALUE",
    price: "FREE ESTIMATES", // Or your standard price like $249.00
    priceNote: "Professional Spring Replacement",
    hasCode: false,
    endDate: null,
  },
};

const currentOffer = ref(deals.default);
const timeLeft = ref({ days: 0, hrs: 0, mins: 0, secs: 0 });

const isTimerActive = computed(() => {
  if (!currentOffer.value.endDate) return false;
  return new Date(currentOffer.value.endDate).getTime() > new Date().getTime();
});

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const dealKey = urlParams.get("deal");

  // Check if deal exists AND hasn't expired
  if (dealKey && deals[dealKey]) {
    const isExpired =
      deals[dealKey].endDate &&
      new Date(deals[dealKey].endDate).getTime() < new Date().getTime();
    if (!isExpired) {
      currentOffer.value = deals[dealKey];
    }
  }

  if (isTimerActive.value) {
    setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(currentOffer.value.endDate).getTime();
      const diff = end - now;
      if (diff > 0) {
        timeLeft.value = {
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hrs: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((diff % (1000 * 60)) / 1000),
        };
      }
    }, 1000);
  }
});
</script>
<style scoped>
/* Colors: Midnight Blue (#1C2A44) and Gold (#E8A900) */
.offer-container {
  max-width: 450px;
  margin: 2rem auto;
  padding: 2rem;
  text-align: center;
  background: #ffffff;
  border: 2px solid #e8a900;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  font-family: "Montserrat", "Inter", sans-serif;
}

.offer-title {
  font-size: 2.5rem;
  /* font-weight: 900; */
  font-family: "Montserrat-ExtraBold", "Inter", sans-serif;
  color: #1c2a44;
  margin: 0;
  line-height: 1;
}

.offer-badge {
  background: #e8a900;
  color: #1c2a44;
  display: inline-block;
  padding: 4px 12px;
  font-weight: 800;
  font-family: "Montserrat-ExtraBold", "Inter", sans-serif;
  font-size: 0.9rem;
  margin-top: 10px;
  border-radius: 4px;
}

.countdown-wrap {
  margin: 20px 0;
}

.timer-label {
  font-size: 0.8rem;
  font-weight: 700;
  font-family: "Montserrat-Bold", "Inter", sans-serif;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 5px;
}

.countdown-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.countdown-box {
  background: #1c2a44;
  color: white;
  padding: 10px 5px;
  border-radius: 8px;
}

.countdown-value {
  display: block;
  font-size: 1.2rem;
  font-weight: 800;
  font-family: "Montserrat-ExtraBold", "Inter", sans-serif;
}

.countdown-label {
  font-size: 0.6rem;
  opacity: 0.8;
}

.interactive-zone {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin: 25px 0;
  border: 2px dashed #e8a900;
}

.reveal-button {
  background: #e8a900;
  color: #1c2a44;
  border: none;
  padding: 15px 30px;
  font-weight: 900;
  font-family: "Montserrat-ExtraBold", "Inter", sans-serif;
  font-size: 1.1rem;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 0 #b38f2b;
  transition: all 0.2s;
}

.reveal-button:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #b38f2b;
}

.promo-code {
  font-size: 2rem;
  font-weight: 900;
  font-family: "Montserrat-ExtraBold", "Inter", sans-serif;
  color: #1c2a44;
  letter-spacing: 4px;
  border: 2px solid #1c2a44;
  display: inline-block;
  padding: 5px 20px;
  margin: 10px 0;
  background: #fff;
}

.cta-button {
  display: block;
  background: #1c2a44;
  color: #e8a900;
  text-decoration: none;
  padding: 18px;
  font-size: 1.4rem;
  font-weight: 900;
  font-family: "Montserrat-ExtraBold", "Inter", sans-serif;
  border-radius: 12px;
  margin-top: 15px;
  transition: transform 0.2s;
}

.cta-button:hover {
  transform: scale(1.03);
}

.offer-details {
  text-align: left;
  margin-bottom: 20px;
}

.detail-item {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  color: #1c2a44;
}

.detail-icon {
  color: #e8a900;
  font-weight: 900;
  font-family: "Montserrat-ExtraBold", "Inter", sans-serif;
  margin-right: 10px;
}

.legal-text {
  font-size: 0.65rem;
  color: #999;
}

.animate-pop {
  animation: pop 0.3s ease-out;
}

@keyframes pop {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
