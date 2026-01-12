<template>
  <div class="invoice-container">
    <div class="invoice-generator">
      <header class="header">
        <div class="brand">
          <div class="logo-mark">YGP</div>
          <div>
            <h2>York Garage Pros</h2>
            <span class="sub-brand">Garage Door & Opener Specialists</span>
          </div>
        </div>

        <div class="doc-toggle">
          <button
            v-for="t in ['QUOTE', 'INVOICE', 'RECEIPT', 'REFUND']"
            :key="t"
            @click="formTypeChange(t)"
            :class="{ active: form.type === t }"
          >
            {{ t }}
          </button>
        </div>
      </header>

      <div class="form-card">
        <div class="grid-layout">
          <div class="input-group">
            <label>Reference Number</label>
            <input disabled v-model="form.number" class="disabled-input" />
          </div>
          <div class="input-group">
            <label>Issue Date</label>
            <input v-model="form.issueDate" type="date" />
          </div>
        </div>
      </div>

      <div class="section-header">
        <label>Client & Location</label>
        <div class="line"></div>
      </div>

      <div class="form-card client-card">
        <div class="input-group full-width">
          <label>Customer Name</label>
          <input v-model="form.clientName" placeholder="Full Name" />
        </div>

        <div class="input-group full-width autocomplete-wrap">
          <label>Update Service Address (Search)</label>
          <gmp-place-autocomplete @gmp-select="onPlaceSelect" requested-region="CA"></gmp-place-autocomplete>
        </div>

        <div class="input-group full-width">
          <label>Confirmed Address</label>
          <input v-model="form.address" placeholder="123 Street, City, ON" />
        </div>

        <div class="grid-layout">
          <div class="input-group">
            <label>Email</label>
            <input v-model="form.email" type="email" placeholder="client@email.com" />
          </div>
          <div class="input-group">
            <label>Phone</label>
            <input v-model="form.phone" placeholder="(905) 000-0000" />
          </div>
        </div>
      </div>

      <div class="section-header">
        <label>Parts & Services</label>
        <div class="line"></div>
      </div>

      <div v-for="(item, index) in form.items" :key="index" class="item-card">
        <div class="item-top">
          <input v-model="item.title" placeholder="Service/Part Name" class="item-title" />
          <button class="remove-btn" @click="removeItem(index)">✕</button>
        </div>
        <textarea v-model="item.desc" placeholder="Details (e.g., 'Installed 2x 15ft Torsion Springs')" class="item-desc"></textarea>
        
        <div class="item-pricing-bar">
          <div class="pricing-inputs">
            <div class="mini-input">
              <span>Qty</span>
              <input v-model.number="item.qty" type="number" />
            </div>
            <div class="mini-input">
              <span>Price</span>
              <input v-model.number="item.price" type="number" />
            </div>
          </div>
          <div class="row-total">
            <span class="label">Total</span>
            <span class="value">${{ (item.qty * item.price).toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <button class="add-btn" @click="addItem">
        <span class="icon">+</span> ADD LINE ITEM
      </button>

      <footer class="summary-section">
        <div class="summary-card">
          <div class="summary-line">
            <span>Subtotal</span>
            <span>${{ subtotal.toFixed(2) }}</span>
          </div>
          
          <div class="summary-line tax-line">
            <div class="tax-edit">
              <span>HST</span>
              <div class="tax-input-pill">
                <input v-model.number="form.taxRate" type="number" />
                <span>%</span>
              </div>
            </div>
            <span>${{ taxAmount.toFixed(2) }}</span>
          </div>

          <div class="total-display">
            <div class="total-label">{{ totalLabel }}</div>
            <div class="total-value" :class="{ 'refund': form.type === 'REFUND' }">
              ${{ grandTotal.toFixed(2) }}
            </div>
          </div>
        </div>

        <div class="action-stack">
          <button class="btn-primary" @click="handleAction('final')">
            {{ finalizeLabel }}
          </button>
          <button class="btn-secondary" @click="handleAction('draft')">
            SAVE AS DRAFT
          </button>
          <a class="btn-link" href="/admin/customers/list">Cancel & Exit</a>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive, computed } from "vue";
import { getNextDocNumber } from "../../js/dbDocService";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { actions } from "astro:actions";
import { generateAndUploadPDF } from "../../js/pdfGeneratorService";

const props = defineProps(["prefilledData", "documentId"]);
const isExistingDoc = !!props.prefilledData?.document;

const form = reactive({
  type: isExistingDoc ? props.prefilledData.document.type.toUpperCase() : props.prefilledData.type.toUpperCase(),
  number: isExistingDoc ? props.prefilledData.document.documentNumber : "",
  issueDate: isExistingDoc ? new Date(props.prefilledData.document.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  dueDate: props.prefilledData?.document?.dueDate ? new Date(props.prefilledData.document.dueDate).toISOString().split('T')[0] : "",
  paymentMethod: props.prefilledData?.document?.paymentMethod || "E-Transfer",
  customerId: props.prefilledData?.customer?.id || "",
  locationId: props.prefilledData?.location?.id || "",
  clientName: props.prefilledData?.customer?.name || "",
  address: props.prefilledData?.location?.address || props.prefilledData?.customer?.address || "",
  email: props.prefilledData?.customer?.email || "",
  phone: props.prefilledData?.customer?.phone || "",
  notes: isExistingDoc ? props.prefilledData.document.notes : "1-year warranty on parts and labor.",
  promoLabel: props.prefilledData?.document?.promoLabel || "Discount",
  discountType: props.prefilledData?.document?.discountType || "fixed",
  discountValue: props.prefilledData?.document?.discountAmount || 0,
  taxRate: isExistingDoc ? (props.prefilledData.document.taxRate ?? 13) : 13, // Sole Prop default 13
  parentDocumentId: props.prefilledData?.document?.parentDocumentId || null,
  items: isExistingDoc 
    ? props.prefilledData.document.items.map(i => ({ title: i.title, desc: i.description, qty: i.quantity, price: i.unitPrice }))
    : [{ title: "", desc: "", qty: 1, price: 0 }]
});

// --- Calculations ---
const subtotal = computed(() => form.items.reduce((s, i) => s + (i.qty * i.price), 0));

const calculatedDiscount = computed(() => {
  return form.discountType === "percent" ? subtotal.value * (form.discountValue / 100) : form.discountValue;
});

const taxAmount = computed(() => {
  const taxableAmount = subtotal.value - calculatedDiscount.value;
  return taxableAmount * (form.taxRate / 100);
});

const grandTotal = computed(() => {
  const total = (subtotal.value - calculatedDiscount.value) + taxAmount.value;
  return form.type === 'REFUND' ? -Math.abs(total) : total;
});

const isLocked = computed(() => isExistingDoc && props.prefilledData.document?.status !== 'draft');
const totalLabel = computed(() => form.type === 'REFUND' ? 'Total Refund' : 'Grand Total');
const finalizeLabel = computed(() => `GENERATE ${form.type} PDF`);

// --- Methods ---
const addItem = () => form.items.push({ title: "", desc: "", qty: 1, price: 0 });
const removeItem = (index) => form.items.length > 1 && form.items.splice(index, 1);

const formTypeChange = async (t) => {
  form.type = t;
  form.number = await getNextDocNumber(t);
};

const onPlaceSelect = async (event) => {
  const { placePrediction } = event;
  if (!placePrediction) return;
  const place = placePrediction.toPlace();
  await place.fetchFields({ fields: ["formattedAddress"] });
  form.address = place.formattedAddress;
};

const handleAction = async (mode) => {
  if (mode === 'final' && !confirm(`Lock and generate ${form.type} PDF?`)) return;

  try {
    let pdfUrl = "";
    if (mode === 'final') {
      pdfUrl = await generateAndUploadPDF(form, {
        subtotal: subtotal.value,
        tax: taxAmount.value,
        discount: calculatedDiscount.value, // Make sure this is passed
        grandTotal: grandTotal.value
      });
    }

    // Prepare the payload to match the Zod Schema exactly
    const payload = { 
      ...form, 
      id: props.prefilledData?.document?.id,
      status: mode === 'final' ? 'sent' : 'draft', 
      pdfUrl 
    };

    const { data, error } = props.documentId 
      ? await actions.updateDocument(payload) 
      : await actions.saveDocument(payload);

    if (error) throw error;
    
    window.location.href = "/admin/customers/list";
  } catch (err) {
    console.error(err);
    alert("Error saving: " + err.message);
  }
};

onMounted(async () => {
  setOptions({ key: import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY, version: "beta" });
  await importLibrary("places");
  if (!props.documentId) await formTypeChange(form.type);
});
</script>

<style scoped>
@import "../../styles/global.css";
/* UX Colors & Variables */
:strike {
  --bg: #0f172a;
  --card: #1e293b;
  --input: #0f172a;
  --accent: #f59e0b;
  --text: #f8fafc;
  --text-dim: #94a3b8;
  --border: #334155;
  --success: #22c55e;
}

.invoice-container { background: #0f172a; min-height: 100vh; padding: 12px; display: flex; justify-content: center; font-family: 'Inter', system-ui, sans-serif; }
.invoice-generator { width: 100%; max-width: 800px; color: #f8fafc; }

/* Header & Branding */
.header { margin-bottom: 24px; display: flex; flex-direction: column; gap: 20px; }
.brand { display: flex; align-items: center; gap: 12px; }
.logo-mark { background: #f59e0b; color: #0f172a; font-weight: 900; padding: 8px; border-radius: 8px; font-size: 14px; }
.brand h2 { margin: 0; font-size: 20px; letter-spacing: -0.5px; }
.sub-brand { color: #94a3b8; font-size: 10px; text-transform: uppercase; font-weight: 600; }

/* Better Toggles */
.doc-toggle { display: grid; grid-template-columns: repeat(2, 1fr); background: #1e293b; padding: 4px; border-radius: 12px; border: 1px solid #334155; }
@media (min-width: 768px) { .doc-toggle { display: flex; } }
.doc-toggle button { background: transparent; border: none; color: #94a3b8; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 11px; transition: 0.2s; }
.doc-toggle button.active { background: #f59e0b; color: #0f172a; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2); }

/* Form Elements */
.form-card { background: #1e293b; padding: 20px; border-radius: 16px; border: 1px solid #334155; margin-bottom: 24px; }
.grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.input-group label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; }
input, textarea { background: #0f172a; border: 1px solid #334155; color: white; padding: 12px; border-radius: 10px; font-size: 16px; width: 100%; }
input:focus { border-color: #f59e0b; outline: none; }

/* Item Overhaul */
.section-header { display: flex; align-items: center; gap: 15px; margin-bottom: 16px; }
.section-header label { font-size: 12px; font-weight: 800; color: #94a3b8; white-space: nowrap; }
.section-header .line { height: 1px; background: #334155; width: 100%; }

.item-card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 16px; margin-bottom: 16px; }
.item-top { display: flex; gap: 10px; margin-bottom: 10px; }
.item-title { font-weight: 700; border-color: transparent; background: rgba(15, 23, 42, 0.5); }
.item-desc { font-size: 14px; min-height: 60px; color: #cbd5e1; margin-bottom: 12px; }

.item-pricing-bar { display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 12px; border-radius: 12px; }
.pricing-inputs { display: flex; gap: 15px; }
.mini-input span { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px; }
.mini-input input { width: 70px; padding: 6px; text-align: center; background: #1e293b; }

.row-total { text-align: right; }
.row-total .label { font-size: 9px; font-weight: 800; color: #64748b; display: block; }
.row-total .value { font-weight: 800; color: #f59e0b; }

.remove-btn { background: #334155; border: none; color: #f87171; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; }

.add-btn { width: 100%; padding: 16px; background: transparent; border: 2px dashed #334155; color: #f59e0b; font-weight: 800; border-radius: 12px; margin-bottom: 40px; cursor: pointer; }

/* Summary & Totals */
.summary-card { background: #1e293b; border: 1px solid #334155; padding: 24px; border-radius: 20px; margin-bottom: 24px; }
.summary-line { display: flex; justify-content: space-between; margin-bottom: 12px; color: #94a3b8; font-weight: 600; }
.tax-edit { display: flex; align-items: center; gap: 8px; }
.tax-input-pill { background: #0f172a; border-radius: 20px; padding: 2px 10px; display: flex; align-items: center; border: 1px solid #334155; }
.tax-input-pill input { width: 30px; border: none; padding: 0; background: transparent; color: #f59e0b; font-weight: 800; text-align: center; }

.total-display { margin-top: 20px; padding-top: 20px; border-top: 2px solid #334155; display: flex; justify-content: space-between; align-items: center; }
.total-label { font-size: 16px; font-weight: 900; }
.total-value { font-size: 32px; font-weight: 900; color: #22c55e; }
.total-value.refund { color: #f87171; }

/* Action Buttons */
.action-stack { display: flex; flex-direction: column; gap: 12px; }
.btn-primary { background: #f59e0b; color: #0f172a; padding: 18px; border-radius: 14px; border: none; font-weight: 900; font-size: 16px; cursor: pointer; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3); }
.btn-secondary { background: #334155; color: white; padding: 16px; border-radius: 14px; border: none; font-weight: 700; cursor: pointer; }
.btn-link { text-align: center; color: #64748b; text-decoration: none; font-size: 13px; margin-top: 8px; }

@media (min-width: 768px) {
  .action-stack { flex-direction: row-reverse; }
  .btn-primary { flex: 2; }
  .btn-secondary { flex: 1; }
}
.client-card { display: flex; flex-direction: column; gap: 16px; }
.full-width { grid-column: span 2; }
.autocomplete-wrap :deep(input) {
  background: #0f172a;
  border: 1px solid #f59e0b; /* Highlighted to show it's a search tool */
}

/* Rest of the styles from previous overhaul... */
.invoice-container { background: #0f172a; min-height: 100vh; padding: 12px; display: flex; justify-content: center; font-family: 'Inter', system-ui, sans-serif; }
.invoice-generator { width: 100%; max-width: 800px; color: #f8fafc; }
.header { margin-bottom: 24px; display: flex; flex-direction: column; gap: 20px; }
.brand { display: flex; align-items: center; gap: 12px; }
.logo-mark { background: #f59e0b; color: #0f172a; font-weight: 900; padding: 8px; border-radius: 8px; font-size: 14px; }
.brand h2 { margin: 0; font-size: 20px; letter-spacing: -0.5px; }
.sub-brand { color: #94a3b8; font-size: 10px; text-transform: uppercase; font-weight: 600; }
.doc-toggle { display: grid; grid-template-columns: repeat(2, 1fr); background: #1e293b; padding: 4px; border-radius: 12px; border: 1px solid #334155; }
@media (min-width: 768px) { .doc-toggle { display: flex; } }
.doc-toggle button { background: transparent; border: none; color: #94a3b8; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 11px; transition: 0.2s; }
.doc-toggle button.active { background: #f59e0b; color: #0f172a; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2); }
.form-card { background: #1e293b; padding: 20px; border-radius: 16px; border: 1px solid #334155; margin-bottom: 24px; }
.grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.input-group label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; }
input, textarea { background: #0f172a; border: 1px solid #334155; color: white; padding: 12px; border-radius: 10px; font-size: 16px; width: 100%; box-sizing: border-box; }
input:focus { border-color: #f59e0b; outline: none; }
.section-header { display: flex; align-items: center; gap: 15px; margin-bottom: 16px; }
.section-header label { font-size: 12px; font-weight: 800; color: #94a3b8; white-space: nowrap; }
.section-header .line { height: 1px; background: #334155; width: 100%; }
.item-card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 16px; margin-bottom: 16px; }
.item-top { display: flex; gap: 10px; margin-bottom: 10px; }
.item-title { font-weight: 700; border-color: transparent; background: rgba(15, 23, 42, 0.5); }
.item-desc { font-size: 14px; min-height: 60px; color: #cbd5e1; margin-bottom: 12px; }
.item-pricing-bar { display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 12px; border-radius: 12px; }
.pricing-inputs { display: flex; gap: 15px; }
.mini-input span { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px; }
.mini-input input { width: 70px; padding: 6px; text-align: center; background: #1e293b; }
.row-total { text-align: right; }
.row-total .label { font-size: 9px; font-weight: 800; color: #64748b; display: block; }
.row-total .value { font-weight: 800; color: #f59e0b; }
.remove-btn { background: #334155; border: none; color: #f87171; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; }
.add-btn { width: 100%; padding: 16px; background: transparent; border: 2px dashed #334155; color: #f59e0b; font-weight: 800; border-radius: 12px; margin-bottom: 40px; cursor: pointer; }
.summary-card { background: #1e293b; border: 1px solid #334155; padding: 24px; border-radius: 20px; margin-bottom: 24px; }
.summary-line { display: flex; justify-content: space-between; margin-bottom: 12px; color: #94a3b8; font-weight: 600; }
.tax-edit { display: flex; align-items: center; gap: 8px; }
.tax-input-pill { background: #0f172a; border-radius: 20px; padding: 2px 10px; display: flex; align-items: center; border: 1px solid #334155; }
.tax-input-pill input { width: 30px; border: none !important; padding: 0 !important; background: transparent !important; color: #f59e0b; font-weight: 800; text-align: center; }
.total-display { margin-top: 20px; padding-top: 20px; border-top: 2px solid #334155; display: flex; justify-content: space-between; align-items: center; }
.total-label { font-size: 16px; font-weight: 900; }
.total-value { font-size: 32px; font-weight: 900; color: #22c55e; }
.total-value.refund { color: #f87171; }
.action-stack { display: flex; flex-direction: column; gap: 12px; }
.btn-primary { background: #f59e0b; color: #0f172a; padding: 18px; border-radius: 14px; border: none; font-weight: 900; font-size: 16px; cursor: pointer; }
.btn-secondary { background: #334155; color: white; padding: 16px; border-radius: 14px; border: none; font-weight: 700; cursor: pointer; }
.btn-link { text-align: center; color: #64748b; text-decoration: none; font-size: 13px; margin-top: 8px; }

@media (min-width: 768px) {
  .action-stack { flex-direction: row-reverse; }
  .btn-primary { flex: 2; }
  .btn-secondary { flex: 1; }
}
</style>