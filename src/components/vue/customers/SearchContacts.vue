<template>
  <div class="search-container">
    <div class="form-group">
      <label>Search Existing Records</label>
      <input
        v-model="searchTerm"
        @input="handleInput"
        type="text"
        placeholder="Start typing name..."
        class="search-input"
      />
    </div>

    <ul v-if="results.length > 0" class="results-list">
      <li 
        v-for="item in results" 
        :key="item.id"
        @click="fillForm(item)"
        class="result-item"
      >
        <div class="result-info">
          <span class="source-icon">{{ item.icon }}</span>
          <div>
            <p class="result-name">{{ item.name }}</p>
            <p class="result-meta">{{ item.email }} • {{ item.sourceType }}</p>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { searchContacts } from "/src/js/dbService.js";

const emit = defineEmits(['select']);
const searchTerm = ref('');
const results = ref([]);
let debounceTimer;

const handleInput = () => {
  clearTimeout(debounceTimer);
  if (searchTerm.value.length < 2) {
    results.value = [];
    return;
  }

  debounceTimer = setTimeout(async () => {
    const { data, error } = await searchContacts({ search: searchTerm.value });
    if (!error) results.value = data;
  }, 300);
};

const fillForm = (item) => {
  // Emit the data back to your main form to fill the fields
  emit('select', item);
  searchTerm.value = ""; // Clear search
  results.value = [];
};
</script>

<style scoped>
.search-container { position: relative; width: 100%; margin-bottom: 20px; }
.results-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 50;
  max-height: 300px;
  overflow-y: auto;
}
.result-item {
  padding: 10px 15px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}
.result-item:hover { background: #f0f7ff; }
.result-info { display: flex; align-items: center; gap: 12px; }
.result-name { font-weight: 600; font-size: 14px; margin: 0; }
.result-meta { font-size: 12px; color: #666; margin: 0; text-transform: capitalize; }
.source-icon { font-size: 18px; }
</style>