<template>
  <div class="crm">
    <header class="crm-header">
      <h1 class="crm-title">York Garage CRM</h1>

      <div class="crm-actions">
        <input v-model="search" placeholder="Search leads..." class="crm-search" />
        <button @click="logout" class="crm-logout">Logout</button>
      </div>
    </header>

    <div class="crm-table-wrapper">
      <table class="crm-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer</th>
            <th>Service</th>
            <th>Status</th>
            <th>Quick Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="lead in filteredLeads" :key="lead.id">
            <td>{{ lead.date }}</td>

            <td>
              <strong>{{ lead.name }}</strong>
              <div class="muted">{{ lead.city }}</div>
            </td>

            <td>{{ lead.service }}</td>

            <td>
              <span :class="['status-badge', statusClass(lead.status)]">
                {{ lead.status }}
              </span>
            </td>

            <td class="actions-cell">
              <div class="btn-group">
                <a :href="'tel:' + lead.phone" class="btn btn-call" title="Call Now"
                  >📞</a
                >

                <a :href="'sms:' + lead.phone" class="btn btn-sms" title="Send SMS">💬</a>

                <a
                  :href="formatWhatsApp(lead.phone)"
                  target="_blank"
                  class="btn btn-wa"
                  title="WhatsApp"
                  >📱</a
                >

                <a
                  :href="'mailto:' + lead.email"
                  class="btn btn-mail"
                  title="Email Client"
                  >✉️</a
                >
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const leads = ref([
  {
    id: 1,
    date: "2025-12-27",
    name: "Mike S.",
    city: "Newmarket",
    service: "Spring Repair",
    status: "Urgent",
    phone: "9055551234",
    email: "mike@example.com",
  },
  {
    id: 2,
    date: "2025-12-26",
    name: "Sarah L.",
    city: "Aurora",
    service: "New Installation",
    status: "Quote Sent",
    phone: "4165556789",
    email: "sarah@gmail.com",
  },
]);

const search = ref("");

const filteredLeads = computed(() => {
  return leads.value.filter(
    (l) =>
      l.name.toLowerCase().includes(search.value.toLowerCase()) ||
      l.city.toLowerCase().includes(search.value.toLowerCase())
  );
});

const statusClass = (status) => {
  return status === "Urgent" ? "status-urgent" : "status-normal";
};

// Formats phone to 19051234567 for WhatsApp
const formatWhatsApp = (phone) => {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/1${clean}`;
};

const logout = () => {
  document.cookie = "crm_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.location.href = "/login";
};
</script>
<style>
/* ===== Root Variables ===== */
:root {
  --bg-dark: #111827;
  --bg-panel: #1f2933;
  --bg-header: #1f2937;
  --border: #374151;
  --text: #e5e7eb;
  --muted: #9ca3af;
  --amber: #f59e0b;
  --red: #7f1d1d;
  --red-text: #fecaca;
  --blue: #1e3a8a;
  --blue-text: #bfdbfe;
}

/* ===== Layout ===== */
.crm {
  padding: 16px;
  background: var(--bg-dark);
  min-height: 100vh;
  color: var(--text);
  font-family: system-ui, -apple-system, sans-serif;
}

/* ===== Header ===== */
.crm-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--bg-header);
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  margin-bottom: 20px;
}

.crm-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--amber);
}

.crm-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.crm-search {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.9rem;
}

.crm-search:focus {
  outline: none;
  border-color: var(--amber);
}

.crm-logout {
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
}

.crm-logout:hover {
  color: white;
}

/* ===== Table ===== */
.crm-table-wrapper {
  background: var(--bg-panel);
  border-radius: 12px;
  overflow-x: auto;
  border: 1px solid var(--border);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.crm-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.crm-table thead {
  background: #374151;
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--muted);
}

.crm-table th,
.crm-table td {
  padding: 14px;
  text-align: left;
}

.crm-table tbody tr {
  border-top: 1px solid var(--border);
}

.crm-table tbody tr:hover {
  background: #2b3440;
}

.muted {
  font-size: 0.75rem;
  color: var(--muted);
}

/* ===== Status Badges ===== */
.status-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-block;
}

.status-urgent {
  background: var(--red);
  color: var(--red-text);
}

.status-normal {
  background: var(--blue);
  color: var(--blue-text);
}

/* ===== Action Link ===== */
.call-link {
  color: var(--amber);
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
}

.call-link:hover {
  text-decoration: underline;
}

/* ===== Desktop Enhancements ===== */
@media (min-width: 768px) {
  .crm-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
:root {
  /* ... your variables ... */
  --green: #065f46;
  --green-text: #d1fae5;
}

.actions-cell {
  min-width: 180px;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.btn {
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  font-size: 1.1rem;
  transition: transform 0.1s ease;
}

.btn:active {
  transform: scale(0.9);
}

.btn-call {
  background: var(--blue);
  color: white;
}
.btn-sms {
  background: #374151;
  color: white;
}
.btn-wa {
  background: var(--green);
  color: white;
}
.btn-mail {
  background: #4b5563;
  color: white;
}

/* Desktop adjustment to keep actions from wrapping */
@media (min-width: 768px) {
  .btn-group {
    justify-content: flex-start;
  }
}

/* Inherit your existing table and layout CSS here */
.crm {
  padding: 16px;
  background: #111827;
  min-height: 100vh;
  color: #e5e7eb;
  font-family: system-ui, -apple-system, sans-serif;
}
</style>
