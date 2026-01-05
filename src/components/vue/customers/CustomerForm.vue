<template>
  <div class="customer-card">
    <h2 class="card-title">{{ isEdit ? "Update" : "Register New" }} Customer</h2>
    <SearchContacts @select="populateFields" />

    <form @submit.prevent="save" class="customer-form">
      <div class="form-group span-2">
        <label>Full Name / Business</label>
        <input
          v-model="form.name"
          type="text"
          required
          placeholder="e.g. John Doe or York Property Mgmt"
        />
      </div>

      <div class="form-group span-1">
        <label>Customer Type</label>
        <select v-model="form.type">
          <option value="residential">Residential</option>
          <option value="commercial">Commercial / Business</option>
          <option value="landlord">Landlord</option>
        </select>
      </div>

      <div class="form-group span-1">
        <label>Phone Number</label>
        <input v-model="form.phone" type="tel" required placeholder="905-555-0123" />
      </div>

      <div class="form-group span-2">
        <label>Email Address</label>
        <input v-model="form.email" type="email" required placeholder="name@email.com" />
      </div>

      <div v-if="form.type === 'commercial'" class="form-group span-2">
        <label>HST Number (Optional)</label>
        <input v-model="form.hstNumber" type="text" placeholder="123456789 RT0001" />
      </div>

      <div class="form-group span-2 section-divider">
        <label class="checkbox-label">
          <input type="checkbox" v-model="hasLocation" />
          <span>Add Service Location / Work Address</span>
        </label>
      </div>

      <transition name="fade">
        <div v-if="hasLocation" class="span-2">
          <div class="form-group mb-4">
            <label>Search Address</label>
            <gmp-place-autocomplete
              @gmp-select="onPlaceSelect"
              requested-region="CA"
            ></gmp-place-autocomplete>
          </div>

          <div class="location-fields grid-inner">
            <div class="form-group span-2">
              <label>Street Address</label>
              <input v-model="form.address" type="text" required />
            </div>
            <div class="form-group span-1">
              <label>City</label>
              <input v-model="form.city" type="text" required />
            </div>
            <div class="form-group span-1">
              <label>Postal Code</label>
              <input v-model="form.postalCode" type="text" required />
            </div>
          </div>
        </div>
      </transition>

      <div class="form-actions span-2">
        <button type="button" class="btn secondary" @click="goBack">Cancel</button>
        <button type="submit" class="btn primary" :disabled="loading">
          {{ loading ? "Saving..." : isEdit ? "Update Customer" : "Create Customer" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"; // Added onMounted
import { actions } from "astro:actions";
// Import the Google Maps loader helpers
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import SearchContacts from './SearchContacts.vue'

const props = defineProps(["initialData", "customerId"]);
const loading = ref(false);
const isEdit = !!props.customerId;
const hasLocation = ref(!!props.initialData?.address);

const form = ref({
  name: props.initialData?.name || "",
  email: props.initialData?.email || "",
  phone: props.initialData?.phone || "",
  type: props.initialData?.type || "residential",
  hstNumber: props.initialData?.hstNumber || "",
  address: props.initialData?.address || "",
  city: props.initialData?.city || "Newmarket",
  postalCode: props.initialData?.postalCode || "",
});
function populateFields(data) {
  form.value.name = data.name;
  form.value.email = data.email || "";
  form.value.phone = data.phone || "";

  // If the record has address data, enable location and fill it
  if (data.address) {
    hasLocation.value = true;
    form.value.address = data.address;
    form.value.city = data.city || "Newmarket";
    form.value.postalCode = data.postalCode || "";
  }
}

const onPlaceSelect = async (event) => {
  const { placePrediction } = event;
  if (!placePrediction) return;

  try {
    const place = await placePrediction.toPlace();
    // Fetch specifically what we need
    await place.fetchFields({
      fields: ["addressComponents", "formattedAddress"],
    });

    // 1. Set the main street address (removing the City/Country part if possible)
    // Most people prefer just the street name in the first box
    const streetNumber =
      place.addressComponents.find((c) => c.types.includes("street_number"))?.longText ||
      "";
    const route =
      place.addressComponents.find((c) => c.types.includes("route"))?.longText || "";

    form.value.address = streetNumber
      ? `${streetNumber} ${route}`
      : place.formattedAddress;

    // 2. Extract City
    const city = place.addressComponents.find((c) => c.types.includes("locality"))
      ?.longText;
    if (city) form.value.city = city;

    // 3. Extract Postal Code
    const postCode = place.addressComponents.find((c) => c.types.includes("postal_code"))
      ?.longText;
    if (postCode) form.value.postalCode = postCode;

    // Open the location section automatically if they picked an address
    hasLocation.value = true;
  } catch (error) {
    console.error("Error fetching place details:", error);
  }
};

onMounted(async () => {
  const apiKey = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return;

  setOptions({
    key: apiKey, // Note: standard loader uses 'apiKey', check your library version
    version: "beta",
  });

  try {
    await importLibrary("places");
  } catch (e) {
    console.error("Google Maps failed to load:", e);
  }
});

async function save() {
  loading.value = true;
  const submissionData = { ...form.value };
  if (!hasLocation.value) {
    submissionData.address = "";
    submissionData.city = "";
    submissionData.postalCode = "";
  }

  const { data, error } = await actions.saveCustomer({
    id: props.customerId,
    ...submissionData,
  });

  if (!error) {
    window.location.href = "/admin/customers?success=true";
  } else {
    alert(`Error: ${error.message}`);
    loading.value = false;
  }
}

function goBack() {
  window.history.back();
}
</script>

<style scoped>
@import "../../../styles/global.css";
/* Grid Layout Improvements */
.customer-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.span-1 {
  grid-column: span 1;
}
.span-2 {
  grid-column: span 2;
}

/* Section Divider for Address */
.section-divider {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #f3f4f6;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-family: "Montserrat-Bold", sans-serif;
  color: #2563eb;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Gray box for the address fields */
.grid-inner {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Standardizing Form Styles */
.customer-card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #1e293b;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 15px;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  border: none;
}

.btn.primary {
  background: #2563eb;
  color: white;
}
.btn.secondary {
  background: #f1f5f9;
  color: #475569;
}
</style>
