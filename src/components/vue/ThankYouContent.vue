<template>
    <div class="thank-you-card">
        <svg v-if="formType === 'booking'" class="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <svg v-else class="icon-email" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
        </svg>

        <h1 class="main-title">{{ title }}</h1>
        <p class="primary-message">{{ primaryMessage }}</p>
        <p class="secondary-message">{{ secondaryMessage }}</p>

        <hr class="divider">

        <div class="next-steps">
            <h3>While you wait...</h3>
            <!-- <a href="/gallery" class="cta-button primary">
                View Our Garage Transformation Gallery
            </a> -->
            
            <a href="/services" class="cta-button secondary">
                Explore More Services
            </a>

            <div class="contact-footer">
                <p>Need urgent help? Call us now:</p>
                <a href="tel:+19059609947" class="phone-link">(905) 960-9947</a>
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
    title: String,
    primaryMessage: String,
    secondaryMessage: String,
    formType: String,
});

// Use computed to apply dynamic classes if necessary
const isBooking = computed(() => props.formType === 'booking');
</script>

<style scoped>
.thank-you-card {
    text-align: center;
    padding: 40px 20px;
    background: #fdfdfd;
    border: 1px solid #eee;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.icon-check, .icon-email {
    width: 60px;
    height: 60px;
    margin-bottom: 20px;
    /* Use your primary color for visual appeal */
    color: var(--navy, #0f2740); 
    stroke-width: 1.5;
}

.icon-check {
    color: var(--gold, #d6a12b); 
}

.main-title {
    font-size: 2.5rem;
    margin-top: 0;
    color: var(--navy, #0f2740);
}

.primary-message {
    font-size: 1.4rem;
    font-weight: 600;
    margin-bottom: 10px;
}

.secondary-message {
    font-size: 1.1rem;
    color: #555;
    margin-bottom: 30px;
}

.divider {
    border: 0;
    border-top: 1px solid #eee;
    margin: 30px 0;
}

.next-steps h3 {
    font-size: 1.2rem;
    margin-bottom: 15px;
    color: var(--navy);
}

.cta-button {
    display: block;
    width: 100%;
    max-width: 400px;
    margin: 10px auto;
    padding: 15px 25px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: bold;
    transition: background 0.2s, transform 0.1s;
}

.primary {
    background: var(--gold, #d6a12b);
    color: var(--navy, #0f2740);
    border: 2px solid var(--gold, #d6a12b);
}

.primary:hover {
    background: #c09020;
}

.secondary {
    background: #fff;
    color: var(--navy, #0f2740);
    border: 2px solid var(--navy, #0f2740);
}

.secondary:hover {
    background: #f5f5f5;
}

.contact-footer {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #eee;
}

.phone-link {
    font-size: 1.5rem;
    color: var(--gold);
    text-decoration: none;
}
</style>