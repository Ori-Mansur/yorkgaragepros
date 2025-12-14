<template>
  <div class="contact-card">
    <h2>Send Us a Message</h2>
    <form @submit.prevent="handleSubmit" id="">
      <div class="form-inputs">
        <div class="input-container">
          <input
            type="text"
            id="fullName"
            v-model="formData.name"
            placeholder="Full Name"
            required
          />
        </div>
        <div class="input-container">
          <input
            type="tel"
            id="phone"
            v-model="formData.phone"
            placeholder="Phone"
            required
          />
        </div>
      </div>

      <div class="form-inputs">
        <input
          type="email"
          id="email"
          v-model="formData.email"
          placeholder="Email Address"
          required
        />
        <select id="service" v-model="formData.service" required>
          <option value="" disabled>Select Service Interest...</option>
          <option value="Door_Repair">24/7 Door Repair / Broken Spring</option>
          <option value="Door_Installation">New Garage Door Installation</option>
          <option value="Epoxy_Floor">Epoxy Floor Coating / Sealing</option>
          <option value="Opener_Service">Garage Door Opener Service</option>
          <option value="General_Inquiry">General Inquiry / Quote</option>
        </select>
      </div>

      <textarea
        rows="5"
        id="notes"
        v-model="formData.notes"
        placeholder="Message / Project Details"
        required
      ></textarea>

      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? "Sending..." : "Send Inquiry" }}
      </button>

      <p v-if="message" :class="messageType">{{ message }}</p>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
// IMPORTANT: You must ensure dbService.js is importable/accessible from the Vue SFC structure.
// If your dbService is a standard JS module, this path should work.
import { saveLeadToFirestore } from "/src/js/dbService.js";

const isSubmitting = ref(false);
const message = ref("");
const messageType = ref("");

const formData = reactive({
  name: "",
  phone: "",
  email: "",
  service: "",
  notes: "",
});

async function handleSubmit() {
  console.log("handleSubmit", isSubmitting);

  if (isSubmitting.value) return; // Prevent double submission

  isSubmitting.value = true;
  message.value = "";
  messageType.value = "";

  // Log form data for debugging
  console.log("Form Data Submitted:", formData);

  try {
    // The keys in formData match the structure needed by saveLeadToFirestore
    const result = await saveLeadToFirestore("contacts", formData, "contactForm");

    if (result.success) {
      message.value = "Thank you! Your message has been sent.";
      messageType.value = "success";
      // Reset the form data after success
      Object.assign(formData, {
        name: "",
        phone: "",
        email: "",
        service: "",
        notes: "",
      });

      // OPTIONAL: Redirect after successful submission (e.g., for GA4 event tracking)
      // window.location.href = '/thank-you/';
    } else {
      message.value = `Error submitting form: ${result.error || "Please try again."}`;
      messageType.value = "error";
    }
  } catch (error) {
    message.value = `An unexpected error occurred: ${error.message}`;
    messageType.value = "error";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
/* Add success/error message styles */
.success {
  color: green;
  margin-top: 10px;
  font-weight: bold;
  text-align: center;
}
.error {
  color: red;
  margin-top: 10px;
  font-weight: bold;
  text-align: center;
}

/* ========== Styles Copied from Original Astro Component ========== */
.contact-card {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: var(--shadow-trust);
}
.contact-card h2 {
  margin-bottom: 16px;
  color: var(--navy);
  font-size: 1.25rem;
}
/* ... (rest of the copied CSS styles) ... */
form input,
form select,
form textarea {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  margin-bottom: 12px;
  font-size: 1rem;
  transition: 0.2s;
  font-family: "Montserrat", "Inter", sans-serif;
}
form button:hover {
  background: #d69f00;
}
.form-inputs {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}
.input-container {
  width: 50%;
}
.contact-card {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: var(--shadow-trust);
}
.contact-card h2 {
  margin-bottom: 16px;
  color: var(--navy);
  font-size: 1.25rem;
}
/* ========== Form Styles ========== */
form input,
form select,
form textarea {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  margin-bottom: 12px;
  font-size: 1rem;
  transition: 0.2s;
  font-family: "Montserrat", "Inter", sans-serif;
}

form input:focus,
form select:focus,
form textarea:focus {
  border-color: var(--gold);
  outline: none;
}
.form-inputs {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}
.input-container {
  width: 50%;
}
.form-inputs input {
  display: block;
  width: 100%;
}
.form-inputs select {
  display: block;

  /* width: 330px; */
}
form button {
  width: 100%;
  padding: 12px;
  background: var(--gold);
  color: var(--navy);
  font-family: "Montserrat-Bold", "Inter", sans-serif;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: 0.2s;
  text-align: center;
}
form button:hover {
  background: #d69f00;
}
/* ... (copy all other styles from your original component) ... */
</style>
