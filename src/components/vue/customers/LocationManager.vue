<template>
  <div class="info-card">
    <header class="card-title">
      <span class="emoji-icon">📍</span> Service Locations
    </header>

    <div class="card-body">
      <div v-for="loc in locations" :key="loc.id" class="location-box existing-loc">
        <div class="loc-content">
          <div class="loc-address">{{ loc.streetNumber }} {{ loc.route }}</div>
          <div class="loc-city">
            {{ loc.city || loc.adminAreaL3 }} {{ loc.postalCode }}
          </div>
        </div>
        <span v-if="loc.isBillingAddress" class="primary-mark">Primary</span>
        <button class="btn-remove" @click="handleRemove(loc.id)">✕</button>
      </div>

      <div v-if="isSearching" class="search-mode">
        <div class="search-flex">
          <gmp-place-autocomplete
            @gmp-select="onPlaceSelect"
            requested-region="CA"
            class="map-input"
          ></gmp-place-autocomplete>
          <button class="btn-cancel" @click="isSearching = false">Cancel</button>
        </div>
      </div>

      <button v-else @click="isSearching = true" class="add-btn">
        + Add Another Address
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { actions } from "astro:actions";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
onMounted(async () => {
  setOptions({ key: import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY, version: "beta" });
  await importLibrary("places");
});

const props = defineProps({
  customerId: String,
  initialLocations: Array, // Changed from Object to Array
});

const locations = ref(props.initialLocations || []);

const isSearching = ref(false);

const onPlaceSelect = async (e) => {
  const { placePrediction } = event;
  if (!placePrediction) return;
  const p = placePrediction.toPlace();

  if (!p) {
    console.error("Place selection failed: No place data found in event", e, p);
    return;
  }
  if (!p.addressComponents) {
    await p.fetchFields({
      fields: ["addressComponents", "formattedAddress", "location", "id"],
    });
  }

  // Helper to find specific component types
  const getComp = (type, useShort = false) => {
    const comp = p.addressComponents?.find((c) => c.types.includes(type));
    return useShort ? comp?.shortText : comp?.longText;
  };

  const newLoc = {
    customerId: props.customerId,
    placeId: p.id,
    formattedAddress: p.formattedAddress,

    // Units are often stored in 'subpremise'
    unit: getComp("subpremise"),
    streetNumber: getComp("street_number"),
    route: getComp("route"),

    neighborHood: getComp("neighborhood"),
    sublocality: getComp("sublocality"),
    city: getComp("locality"),

    // Administrative Levels
    adminAreaL1: getComp("administrative_area_level_1", true), // Short: 'ON'
    adminAreaL2: getComp("administrative_area_level_2"), // 'York Region'
    adminAreaL3: getComp("administrative_area_level_3"),
    adminAreaL4: getComp("administrative_area_level_4"),

    country: getComp("country"),
    postalCode: getComp("postal_code"),

    latitude: p.location?.lat(),
    longitude: p.location?.lng(),
  };

  const { data, error } = await actions.saveLocation(newLoc);
  if (!error) {
    // If the data returned successfully, push to local list or reload
    isSearching.value = false;
    window.location.reload();
  }
};

const handleRemove = async (id) => {
  if (confirm("Remove this service location?")) {
    const { error } = await actions.deleteLocation({ id });
    if (!error) {
      window.location.reload();
    }
  }
};
</script>

<style scoped>
.location-box {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
.loc-address {
  font-weight: 700;
  color: #1e293b;
  font-size: 13px;
}
.loc-city {
  font-size: 12px;
  color: #64748b;
}

.btn-remove {
  background: #fee2e2;
  color: #ef4444;
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}
.primary-mark {
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  /* width: 24px; */
  height: 24px;
  padding: 10px 5px;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-remove:hover {
  background: #fca5a5;
}

.search-mode {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.search-flex {
  display: flex;
  gap: 8px;
}
.map-input {
  flex: 1;
}

.btn-cancel {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}

.search-hint {
  font-size: 11px;
  color: #94a3b8;
  margin: 0;
}

.add-btn {
  display: block;
  width: 100%;
  padding: 10px;
  background: #fff;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
</style>
