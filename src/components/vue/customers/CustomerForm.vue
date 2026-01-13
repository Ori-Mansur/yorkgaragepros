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
            <label>Search Address (Google Maps)</label>
            <gmp-place-autocomplete
              @gmp-select="onPlaceSelect"
              requested-region="CA"
            ></gmp-place-autocomplete>
          </div>

          <div class="location-fields grid-inner">
            <div class="form-group span-2">
              <label>Street Address</label>
              <input v-model="form.address" type="text" :required="hasLocation" />
            </div>
            <div class="form-group span-1">
              <label>City</label>
              <input v-model="form.city" type="text" :required="hasLocation" />
            </div>
            <div class="form-group span-1">
              <label>Postal Code</label>
              <input v-model="form.postalCode" type="text" :required="hasLocation" />
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
import { ref, onMounted } from "vue";
import { actions } from "astro:actions";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import SearchContacts from './SearchContacts.vue';

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
  
  // New Detailed Location Fields
  placeId: props.initialData?.placeId || "",
  formattedAddress: props.initialData?.formattedAddress || "",
  unit: props.initialData?.unit || "",
  streetNumber: props.initialData?.streetNumber || "",
  route: props.initialData?.route || "",
  neighborHood: props.initialData?.neighborHood || "",
  sublocality: props.initialData?.sublocality || "",
  city: props.initialData?.city || "Newmarket",
  adminAreaL1: props.initialData?.adminAreaL1 || "",
  adminAreaL2: props.initialData?.adminAreaL2 || "",
  adminAreaL3: props.initialData?.adminAreaL3 || "",
  adminAreaL4: props.initialData?.adminAreaL4 || "",
  postalCode: props.initialData?.postalCode || "",
  latitude: props.initialData?.latitude || null,
  longitude: props.initialData?.longitude || null,
});

function populateFields(data) {
  form.value.name = data.name;
  form.value.email = data.email || "";
  form.value.phone = data.phone || "";

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
    await place.fetchFields({
      fields: ["addressComponents", "formattedAddress", "location", "id"],
    });

    const getComp = (type, useShort = false) => {
      const comp = place.addressComponents.find((c) => c.types.includes(type));
      return useShort ? comp?.shortText : comp?.longText;
    };

    // Populate the form with granular data
    form.value.placeId = place.id;
    form.value.formattedAddress = place.formattedAddress;
    
    // Address Breakdown
    form.value.unit = getComp("subpremise");
    form.value.streetNumber = getComp("street_number");
    form.value.route = getComp("route");
    
    // Geographical Areas
    form.value.neighborHood = getComp("neighborhood");
    form.value.sublocality = getComp("sublocality");
    form.value.city = getComp("locality") || getComp("sublocality") || "Newmarket";
    
    // Administrative Levels
    form.value.adminAreaL1 = getComp("administrative_area_level_1", true); // e.g., 'ON'
    form.value.adminAreaL2 = getComp("administrative_area_level_2");       // e.g., 'York Region'
    form.value.adminAreaL3 = getComp("administrative_area_level_3");
    form.value.adminAreaL4 = getComp("administrative_area_level_4");
    
    form.value.postalCode = getComp("postal_code");
    
    // Coordinates (for future map features)
    if (place.location) {
      form.value.latitude = place.location.lat();
      form.value.longitude = place.location.lng();
    }

    // Set simple display address for the UI input
    const mainStreet = `${form.value.streetNumber} ${form.value.route}`.trim();
    form.value.address = form.value.unit ? `${form.value.unit}-${mainStreet}` : mainStreet;

    hasLocation.value = true;
  } catch (error) {
    console.error("Error fetching place details:", error);
  }
};

onMounted(async () => {
  const apiKey = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return;

  setOptions({
    key: apiKey,
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
    // Reset all location-related fields
    const fieldsToReset = [
      'placeId', 'formattedAddress', 'unit', 'streetNumber', 'route', 
      'neighborHood', 'sublocality', 'city', 'adminAreaL1', 'adminAreaL2', 
      'adminAreaL3', 'adminAreaL4', 'postalCode', 'latitude', 'longitude'
    ];
    fieldsToReset.forEach(field => submissionData[field] = "");
  }

  const { data, error } = await actions.saveCustomer({
    id: props.customerId,
    ...submissionData,
  });

  if (!error) {
    window.location.href = "/admin/customers/list";
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
/* Grid Layout */
.customer-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

/* 📱 Mobile Responsive Rules */
@media (max-width: 640px) {
  .customer-card {
    padding: 15px;
  }
  .customer-form {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  .span-1, .span-2 {
    grid-column: span 1 !important;
  }
  .grid-inner {
    grid-template-columns: 1fr !important;
    padding: 15px !important;
  }
  .form-actions {
    flex-direction: column-reverse;
    gap: 10px;
  }
  .btn {
    width: 100%;
    padding: 14px;
  }
  .form-group input, .form-group select {
    font-size: 16px; /* Prevents mobile zoom on focus */
  }
}

/* Desktop Spans */
@media (min-width: 641px) {
  .span-1 { grid-column: span 1; }
  .span-2 { grid-column: span 2; }
}

.section-divider {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #f3f4f6;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-weight: 700;
  color: #2563eb;
  padding: 10px 0;
}

.checkbox-label input {
  width: 20px;
  height: 20px;
}

.grid-inner {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.customer-card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  max-width: 800px;
  margin: 0 auto;
}

.card-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.5rem;
  color: #0f172a;
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
  background-color: #fff;
}

.form-group input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn.primary {
  background: #2563eb;
  color: white;
}

.btn.secondary {
  background: #f1f5f9;
  color: #475569;
}

.mb-4 { margin-bottom: 1rem; }

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>