<template>
  <div class="customer-directory">
    <div class="search-header">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="Search name, email or phone..."
        />
      </div>
    </div>

    <div class="table-container">
      <table class="customer-table">
        <thead>
          <tr class="hide-mobile">
            <th class="col-icon"></th>
            <th class="col-name">Customer</th>
            <th class="col-contact">Contact</th>
            <th class="col-type">Type</th>
            <th class="col-address">Address</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="c in filteredCustomers" :key="c.id">
            <tr
              class="customer-row"
              :class="{ 'row-active': isExpanded(c.id) }"
              @click="toggleRow(c.id)"
            >
              <td class="cell-icon hide-mobile">
                <span class="expand-arrow" :class="{ 'is-rotated': isExpanded(c.id) }">❯</span>
              </td>
              <td class="cell-name">
                <div class="primary-text">{{ c.name }}</div>
                <div class="secondary-text mobile-only">{{ c.phone }}</div>
                <div class="secondary-text hide-mobile">ID: {{ c.id.split("-")[0] }}</div>
              </td>
              <td class="cell-contact hide-mobile">
                <div class="email-text">{{ c.email }}</div>
                <div class="phone-text">{{ c.phone }}</div>
              </td>
              <td class="cell-type">
                <span :class="['status-badge', c.type]">{{ c.type }}</span>
              </td>
              <td class="cell-address hide-mobile">
                <span class="address-text">{{ c.location?.address || "---" }}</span>
              </td>
              <td class="cell-actions" @click.stop>
                <div class="action-dropdown">
                  <button class="dropdown-trigger">Create ↓</button>
                  <div class="dropdown-menu">
                    <a :href="`/admin/documents/new?type=QUOTE&customerId=${c.id}&locId=${c.location?.id || ''}`">New Quote</a>
                    <a :href="`/admin/documents/new?type=INVOICE&customerId=${c.id}&locId=${c.location?.id || ''}`">New Invoice</a>
                    <a :href="`/admin/documents/new?type=RECEIPT&customerId=${c.id}&locId=${c.location?.id || ''}`" class="direct-pay-link">Direct Receipt</a>
                  </div>
                </div>
              </td>
            </tr>

            <tr v-if="isExpanded(c.id)" class="details-row">
              <td colspan="6">
                <div class="details-pane">
                  <div class="mobile-actions-bar">
                     <a :href="`/admin/customers/${c.id}`" class="btn-edit-profile">
                        Edit Profile ✏️
                     </a>
                  </div>

                  <div class="details-layout">
                    <div class="info-card">
                      <header class="card-title">
                        <span class="emoji-icon">📄</span> Documents
                      </header>
                      <div class="card-body">
                        <div v-if="c.documents?.length" class="history-list">
                          <div v-for="doc in c.documents" :key="doc.id" class="history-item">
                            <div class="history-meta">
                              <span :class="['doc-dot', doc.type]"></span>
                              <div class="doc-info">
                                <div class="primary-text">{{ doc.documentNumber }}</div>
                                <div class="secondary-text uppercase">{{ doc.type }} — {{ doc.status }}</div>
                              </div>
                              <div class="doc-price">${{ Number(doc.totalAmount).toFixed(2) }}</div>
                            </div>
                            
                            <div class="doc-actions-grid">
                              <a v-if="doc.pdfUrl" :href="doc.pdfUrl" target="_blank" class="btn-view">View PDF</a>
                              <a v-else :href="`/admin/documents/${doc.id}`" class="btn-edit">Edit Draft</a>

                              <template v-if="doc.type === 'QUOTE'">
                                <button @click="handleConvert(doc, 'INVOICE')" class="btn-convert">Invoice</button>
                              </template>

                              <template v-if="doc.type === 'INVOICE'">
                                <button v-if="doc.status !== 'paid'" @click="handleConvert(doc, 'RECEIPT')" class="btn-pay">Record Pay</button>
                                <span v-else class="paid-badge">✓ PAID</span>
                              </template>
                              <span v-if="doc.type === 'RECEIPT'" class="paid-badge">FINALIZED</span>
                            </div>
                          </div>
                        </div>
                        <p v-else class="empty-msg">No previous documents on file.</p>
                      </div>
                    </div>

                    <!-- <div class="info-card">
                      <header class="card-title">
                        <span class="emoji-icon">📍</span> Service Locations
                      </header>
                      <div class="card-body">
                        <div class="location-box" v-if="c.location">
                          <div class="loc-address">{{ c.location.address }}</div>
                          <div class="loc-city">{{ c.location.city }}, {{ c.location.postalCode }}</div>
                        </div>
                        <a :href="`/admin/customers/${c.id}`" class="add-btn">+ Manage Locations</a>
                      </div>
                    </div> -->
                    <LocationManager 
                      :customerId="c.id" 
                      :initialLocations="c.locations" 
                      />
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import LocationManager from './LocationManager.vue';

const props = defineProps(["initialCustomers"]);
const expandedRows = ref([]);
const searchQuery = ref("");

const filteredCustomers = computed(() => {
  if (!props.initialCustomers) return [];
  const query = searchQuery.value.toLowerCase();
  return props.initialCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.phone?.includes(query)
  );
});

const toggleRow = (id) => {
  const index = expandedRows.value.indexOf(id);
  if (index > -1) expandedRows.value.splice(index, 1);
  else expandedRows.value.push(id);
};

const isExpanded = (id) => expandedRows.value.includes(id);

const handleConvert = (doc, targetType) => {
  if (confirm(`Create ${targetType} from ${doc.documentNumber}?`)) {
    window.location.href = `/admin/documents/new?customerId=${doc.customerId}&type=${targetType}&sourceId=${doc.id}`;
  }
};
</script>

<style scoped>
.customer-directory {
  font-family: 'Montserrat', sans-serif;
  padding: 10px;
}

/* Search Header */
.search-header {
  margin-bottom: 20px;
}
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 15px;
  color: #94a3b8;
}
.search-input {
  width: 100%;
  padding: 14px 15px 14px 45px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 16px; /* Prevents iOS zoom */
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

/* Table Design */
.table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}
.customer-table {
  width: 100%;
  border-collapse: collapse;
}
.customer-table th {
  padding: 15px;
  background: #f8fafc;
  color: #64748b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

/* Row Styling */
.customer-row {
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}
.customer-row:hover {
  background: #f8fafc;
}
.row-active {
  background: #f1f5f9 !important;
  box-shadow: inset 4px 0 0 #2563eb;
}
.customer-row td {
  padding: 15px;
  border-bottom: 1px solid #f1f5f9;
}

/* Text Utility */
.primary-text { font-weight: 700; color: #0f172a; font-size: 14px; }
.secondary-text { font-size: 12px; color: #94a3b8; margin-top: 2px; }

/* Status Badges */
.status-badge {
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}
.status-badge.residential { background: #dcfce7; color: #166534; }
.status-badge.commercial { background: #dbeafe; color: #1e40af; }
.status-badge.landlord { background: #fef3c7; color: #92400e; }

/* Dropdown Logic */
.action-dropdown { position: relative; }
.dropdown-trigger {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
}
.dropdown-menu {
  display: none;
  position: fixed;
  /* right: 0;
  top: calc(100% + 5px); */
  background: white;
  min-width: 160px;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  z-index: 50;
  border: 1px solid #e2e8f0;
}
.action-dropdown:hover .dropdown-menu { display: block; }
.dropdown-menu a {
  display: block;
  padding: 12px 15px;
  font-size: 13px;
  color: #1e293b;
  text-decoration: none;
}
.dropdown-menu a:hover { background: #f8fafc; }
.direct-pay-link { border-top: 1px solid #f1f5f9; color: #0ea5e9 !important; font-weight: 700; }

/* Expansion Pane */
.details-pane { padding: 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.details-layout { display: flex; flex-direction: column; gap: 20px; }

.mobile-actions-bar { margin-bottom: 15px; }
.btn-edit-profile {
  display: inline-block;
  background: white;
  border: 1px solid #cbd5e1;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  color: #1e293b;
  transition: all 0.2s;
}
.btn-edit-profile:hover { background: #f1f5f9; border-color: #94a3b8; }

/* History Cards */
.history-item { 
  background: #fff; border: 1px solid #e2e8f0; padding: 15px; 
  border-radius: 10px; margin-bottom: 12px;
}
.history-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.doc-dot { width: 10px; height: 10px; border-radius: 50%; }
.doc-dot.quote { background: #f59e0b; }
.doc-dot.invoice { background: #3b82f6; }
.doc-dot.receipt { background: #10b981; }
.doc-info { flex-grow: 1; }
.doc-price { font-weight: 800; font-size: 15px; color: #1e293b; }

.doc-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.btn-view, .btn-edit, .btn-convert, .btn-pay {
  padding: 10px; font-size: 11px; font-weight: 700; text-align: center;
  text-transform: uppercase; border-radius: 6px; border: none; text-decoration: none;
}
.btn-view { background: #f1f5f9; color: #475569; }
.btn-edit { background: #fffbeb; color: #92400e; border: 1px solid #fef3c7; }
.btn-convert { background: #3b82f6; color: white; }
.btn-pay { background: #10b981; color: white; }
.paid-badge { text-align: center; font-size: 11px; font-weight: 800; color: #10b981; padding: 10px; }

.info-card { background: white; padding: 18px; border-radius: 10px; border: 1px solid #e2e8f0; }
.card-title { font-size: 14px; font-weight: 800; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; color: #334155; }
.location-box { padding: 12px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; font-size: 13px; color: #475569; line-height: 1.5; }
.add-btn {
  display: block; width: 100%; margin-top: 12px; padding: 10px;
  background: #fff; border: 1px dashed #cbd5e1; border-radius: 8px;
  color: #64748b; text-align: center; font-size: 12px; font-weight: 600; text-decoration: none;
}

/* Animations */
.expand-arrow { display: inline-block; transition: transform 0.25s ease; font-size: 10px; color: #94a3b8; }
.expand-arrow.is-rotated { transform: rotate(90deg); color: #2563eb; }

/* Responsive Media Queries */
@media (max-width: 768px) {
  .hide-mobile { display: none !important; }
  .mobile-only { display: block !important; }
  .cell-name { width: 70%; }
  .customer-row td { padding: 15px 10px; }
  .dropdown-trigger { width: 100%; }
  .btn-edit-profile { width: 100%; text-align: center; }
}

@media (min-width: 769px) {
  .mobile-only { display: none !important; }
  .details-layout { display: grid; grid-template-columns: 1.5fr 1fr; }
}
</style>