<template>
  <div class="customer-directory">
    <div class="search-header">
      <input
        v-model="searchQuery"
        class="search-input"
        placeholder="Search name, email or phone..."
      />
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
                <span class="address-text">{{ c.location ? c.location.address : "---" }}</span>
              </td>
              <td class="cell-actions" @click.stop>
                <div class="action-dropdown">
                  <button class="dropdown-trigger">Create ↓</button>
                  <div class="dropdown-menu">
                    <a :href="`/admin/documents/new?type=quote&customerId=${c.id}&locId=${c.location?.id || ''}`">New Quote</a>
                    <a :href="`/admin/documents/new?type=invoice&customerId=${c.id}&locId=${c.location?.id || ''}`">New Invoice</a>
                    <a :href="`/admin/documents/new?type=receipt&customerId=${c.id}&locId=${c.location?.id || ''}`" class="direct-pay-link">Direct Receipt</a>
                  </div>
                </div>
              </td>
            </tr>

            <tr v-if="isExpanded(c.id)" class="details-row">
              <td colspan="6">
                <div class="details-pane">
                  <div class="mobile-actions-bar">
                     <a :href="`/admin/customers/${c.id}`" class="btn-edit-profile">
                        Edit Customer Profile ✏️
                     </a>
                  </div>

                  <div class="details-layout">
                    <div class="info-card">
                      <header class="card-title">
                        <span class="emoji-icon">📄</span> Document History
                      </header>
                      <div class="card-body">
                        <div v-if="c.documents.length" class="history-list">
                          <div v-for="doc in c.documents" :key="doc.id" class="history-item">
                            <div class="history-meta">
                              <span :class="['doc-dot', doc.type]"></span>
                              <div class="doc-info">
                                <div class="primary-text">{{ doc.documentNumber }}</div>
                                <div class="secondary-text uppercase">{{ doc.type }} — {{ doc.status }}</div>
                              </div>
                              <div class="doc-price">${{ doc.totalAmount.toFixed(2) }}</div>
                            </div>
                            
                            <div class="doc-actions-grid">
                              <a v-if="doc.pdfUrl" :href="doc.pdfUrl" target="_blank" class="btn-view">View PDF</a>
                              <a v-else :href="`/admin/documents/${doc.id}?customerId=${c.id}`" class="btn-edit">Edit Draft</a>

                              <template v-if="doc.type.toLowerCase() === 'quote' && doc.pdfUrl">
                                <button @click="handleConvert(doc, 'invoice')" class="btn-convert">Invoice</button>
                                <button @click="handleConvert(doc, 'receipt')" class="btn-pay skip-inv">Quick Pay</button>
                              </template>

                              <template v-if="doc.type.toLowerCase() === 'invoice' && doc.pdfUrl">
                                <button v-if="doc.status !== 'paid'" @click="handleConvert(doc, 'receipt')" class="btn-pay">Record Pay</button>
                                <span v-else class="paid-badge">✓ PAID</span>
                              </template>
                              <span v-if="doc.type.toLowerCase() === 'receipt'" class="paid-badge">FINALIZED</span>
                            </div>
                          </div>
                        </div>
                        <p v-else class="empty-msg">No previous documents on file.</p>
                      </div>
                    </div>

                    <div class="info-card">
                      <header class="card-title">
                        <span class="emoji-icon">📍</span> Service Locations
                      </header>
                      <div class="card-body">
                        <div class="location-box" v-if="c.location">
                          <div class="loc-address">{{ c.location.address }}</div>
                          <div class="loc-city">{{ c.location.city }}, {{ c.location.postalCode }}</div>
                        </div>
                        <button class="add-btn">+ Add Service Location</button>
                      </div>
                    </div>
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
  let confirmMsg = targetType === "invoice" 
    ? `Create Invoice from ${doc.documentNumber}?` 
    : `Create Receipt from ${doc.documentNumber}?`;

  if (confirm(confirmMsg)) {
    window.location.href = `/admin/documents/new?customerId=${doc.customerId}&type=${targetType}&sourceId=${doc.id}`;
  }
};
</script>

<style scoped>
@import "../../../styles/global.css";

.customer-directory { font-family: 'Montserrat', sans-serif; padding: 10px; }
.search-header { margin-bottom: 15px; }
.search-input {
  width: 100%; padding: 12px 15px; border-radius: 8px;
  border: 1px solid #cbd5e1; font-size: 16px; /* 16px prevents iOS zoom on focus */
}

.table-container { background: white; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
.customer-table { width: 100%; border-collapse: collapse; }

/* Desktop Headers */
.customer-table th {
  padding: 12px 15px; background: #f8fafc; color: #64748b;
  font-size: 11px; text-transform: uppercase; text-align: left;
}

.customer-row td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; }
.primary-text { font-weight: 700; color: #0f172a; }
.secondary-text { font-size: 12px; color: #94a3b8; }

/* Status Badges */
.status-badge { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
.status-badge.residential { background: #dcfce7; color: #166534; }
.status-badge.commercial { background: #dbeafe; color: #1e40af; }

/* Action Buttons */
.dropdown-trigger {
  background: #10b981; color: white; border: none; padding: 6px 12px;
  border-radius: 4px; font-weight: 600; font-size: 12px; white-space: nowrap;
}
.action-dropdown { position: relative; }
.dropdown-menu {
  display: none; position: absolute; right: 0; top: 100%;
  background: white; min-width: 150px; border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 100; border: 1px solid #e2e8f0;
}
.action-dropdown:hover .dropdown-menu { display: block; }
.dropdown-menu a { display: block; padding: 10px 15px; font-size: 13px; color: #1e293b; text-decoration: none; }
.direct-pay-link { border-top: 1px solid #f1f5f9; color: #0ea5e9 !important; }

/* History & Details */
.details-pane { padding: 15px; background: #f8fafc; }
.details-layout { display: flex; flex-direction: column; gap: 15px; }

/* Edit Profile Button */
.mobile-actions-bar { margin-bottom: 15px; }
.btn-edit-profile {
  display: block; text-align: center; background: white; border: 1px solid #cbd5e1;
  padding: 10px; border-radius: 6px; font-size: 13px; font-weight: 600;
  text-decoration: none; color: #1e293b;
}

/* History Items */
.history-item { 
  background: #fff; border: 1px solid #e2e8f0; padding: 12px; 
  border-radius: 8px; margin-bottom: 10px;
}
.history-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.doc-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.doc-dot.quote { background: #f59e0b; }
.doc-dot.invoice { background: #3b82f6; }
.doc-dot.receipt { background: #10b981; }
.doc-info { flex-grow: 1; }
.doc-price { font-weight: 700; font-size: 14px; }

.doc-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.btn-view, .btn-edit, .btn-convert, .btn-pay {
  padding: 8px 5px; font-size: 10px; font-weight: 700; text-align: center;
  text-transform: uppercase; border-radius: 4px; border: none; text-decoration: none;
}
.btn-view { background: #f1f5f9; color: #475569; }
.btn-edit { background: #fef3c7; color: #92400e; }
.btn-convert { background: #3b82f6; color: white; }
.btn-pay { background: #10b981; color: white; }
.skip-inv { background: #0ea5e9; }
.paid-badge { text-align: center; font-size: 10px; font-weight: 800; color: #10b981; }

.info-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
.card-title { font-size: 13px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 5px; }
.location-box { padding: 10px; background: #f1f5f9; border-radius: 4px; font-size: 13px; }

/* Responsive Media Queries */
@media (max-width: 768px) {
  .hide-mobile { display: none; }
  .mobile-only { display: block; }
  .details-layout { grid-template-columns: 1fr; }
  
  /* Make the main customer cell wider on mobile */
  .cell-name { width: 50%; }
  .cell-actions { width: auto; }
}

@media (min-width: 769px) {
  .mobile-only { display: none; }
  .details-layout { display: grid; grid-template-columns: 1.6fr 1fr; }
  .btn-edit-profile { display: inline-block; width: auto; padding: 6px 15px; }
}
</style>