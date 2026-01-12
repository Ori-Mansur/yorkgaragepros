<template>
  <div class="invoice-container">
    <div class="invoice-generator">
      <header class="header">
        <div class="brand">
          <h2>York Garage Pros</h2>
          <span class="sub-brand">Document Management System</span>
        </div>

        <div class="doc-toggle">
          <button
            v-for="t in ['QUOTE', 'INVOICE', 'RECEIPT']"
            :key="t"
            @click="formTypeChange(t)"
            :class="{ active: form.type === t }"
          >
            {{ t }}
          </button>
        </div>
      </header>

      <section class="section-group">
        <label class="section-label">Document Tracking</label>
        <div class="grid-layout">
          <div class="input-wrapper">
            <span class="field-hint">REFERENCE NUMBER</span>
            <input disabled v-model="form.number" :placeholder="getPlaceholder" />
          </div>
          <div class="input-wrapper">
            <span class="field-hint">ISSUE DATE</span>
            <input v-model="form.issueDate" type="date" />
          </div>
          <div class="input-wrapper" v-if="form.type !== 'RECEIPT'">
            <span class="field-hint uppercase"
              >{{ form.type === "QUOTE" ? "Expiry" : "Due" }} Date</span
            >
            <input v-model="form.dueDate" type="date" />
          </div>
          <div class="input-wrapper" v-if="form.type === 'RECEIPT'">
            <span class="field-hint">PAYMENT METHOD</span>
            <select v-model="form.paymentMethod">
              <option value="Credit Card">Credit Card</option>
              <option value="E-Transfer">E-Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Debit">Debit</option>
            </select>
          </div>
        </div>
      </section>

      <section class="section-group">
        <label class="section-label">{{
          form.type === "RECEIPT" ? "Customer details" : "Bill to:"
        }}</label>
        <div class="grid-layout">
          <input
            v-model="form.clientName"
            placeholder="Full Name / Business"
            required
            class="span-all"
          />
          <gmp-place-autocomplete
            @gmp-select="onPlaceSelect"
            class="span-all"
            requested-region="CA"
            name="string"
          ></gmp-place-autocomplete>

          <input
            ref="addressInput"
            v-model="form.address"
            placeholder="Service Address"
            class="span-all"
          />
          <input v-model="form.email" placeholder="Email Address" />
          <input v-model="form.phone" placeholder="(000) 000-0000" />
        </div>
      </section>

      <section class="section-group">
        <label class="section-label">Products / Services</label>
        <div v-for="(item, index) in form.items" :key="index" class="item-row">
          <input v-model="item.title" placeholder="Title" class="item-title" />
          <input v-model="item.desc" placeholder="Description" class="item-desc" />
          <input
            v-model.number="item.qty"
            type="number"
            placeholder="Qty"
            class="item-qty"
          />
          <input
            v-model.number="item.price"
            type="number"
            placeholder="Price"
            class="item-price"
          />
          <button class="remove-btn" @click="removeItem(index)" title="Remove">✕</button>
        </div>
        <button class="add-btn" @click="addItem">+ ADD LINE ITEM</button>
      </section>

      <section class="promo-box">
        <label class="section-label">Promotion / Discount</label>
        <div class="promo-grid">
          <input v-model="form.promoLabel" placeholder="Promo name (Optional)" />
          <div class="promo-inputs">
            <select v-model="form.discountType">
              <option value="fixed">$</option>
              <option value="percent">%</option>
            </select>
            <input v-model.number="form.discountValue" type="number" placeholder="0" />
          </div>
        </div>
      </section>
      <section class="section-group">
        <label class="section-label">Notes / Terms</label>
        <textarea
          v-model="form.notes"
          placeholder="Enter any specific terms, warranty info, or job notes here..."
          class="notes-textarea"
        ></textarea>
      </section>

      <footer class="summary-footer">
        <div class="summary-card">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>CA${{ subtotal.toFixed(2) }}</span>
          </div>
          <div class="summary-row total-row">
            <span>{{ form.type === "RECEIPT" ? "Total Paid" : "Grand Total" }}</span>
            <span class="total-amount">CA${{ grandTotal.toFixed(2) }}</span>
          </div>
        </div>

        <div class="action-grid" v-if="!isLocked">
          <button class="save-draft-btn" @click="handleAction('draft')">
            SAVE DRAFT
          </button>
          <button class="generate-btn" @click="handleAction('final')">
            GENERATE {{ form.type }} PDF
          </button>
        </div>

        <div v-else class="locked-banner">
          <p>This document is finalized and cannot be modified.</p>
          <a
            :href="props.prefilledData.document.pdfUrl"
            target="_blank"
            class="view-final-btn"
            >VIEW PDF</a
          >
        </div>

        <a class="cancel-btn" href="/admin/customers/list"> Cancel / Back </a>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive, computed } from "vue";

// Import the service we just created
import { getNextDocNumber } from "../../js/dbDocService";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { actions } from "astro:actions";
import { generateAndUploadPDF } from "../../js/pdfGeneratorService";

const props = defineProps(["prefilledData", "documentId"]);

const addressInput = ref(null);

onMounted(async () => {
  const apiKey = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Missing Google Maps API Key in .env");
    return;
  }

  // STEP 1: Set options first
  setOptions({
    key: apiKey,
    version: "beta", // "beta" is required for the new PlaceAutocompleteElement
  });

  try {
    // STEP 2: Import the library. This triggers the script injection.
    // In Astro/Vue, this will now correctly include your key.
    await importLibrary("places");
    console.log("Google Places (New) initialized.");
  } catch (e) {
    console.error("Google Maps failed to load:", e);
  }
  // Auto-generate number on load
  if (!props.documentId) {
    await formTypeChange(form.type);
  } else {
  }
});

// The new event handler for the custom element
const onPlaceSelect = async (event) => {
  // 1. Get the prediction from the event
  // Note: 'placePrediction' is provided directly in the event detail
  const { placePrediction } = event;
  if (!placePrediction) return;

  try {
    // 2. Convert prediction to a Place object
    const place = placePrediction.toPlace();
    // 3. Explicitly fetch the fields you need (New API requirement)
    // For an invoice, you usually want the clean 'formattedAddress'
    await place.fetchFields({
      fields: ["formattedAddress", "addressComponents", "location"],
    });

    // 4. Update your Vue form state
    form.address = place.formattedAddress;

    // Optional: Log it to verify
    console.log("Verified Address:", place.formattedAddress);
  } catch (error) {
    console.error("Error fetching place details:", error);
  }
};

const saveToDatabase = async (firebaseUrl, status = "draft") => {
  const payload = {
    id: props.documentId,
    customerId: form.customerId,
    locationId: form.locationId,
    type: form.type.toLowerCase(),
    documentNumber: form.number,
    status: status, // Pass the status (draft or sent)
    subtotal: subtotal.value,
    discountAmount: calculatedDiscount.value,
    promoLabel: form.promoLabel,
    taxAmount: (subtotal.value - calculatedDiscount.value) * 0.13,
    totalAmount: grandTotal.value,
    parentDocumentId: form.parentDocumentId,
    pdfUrl: firebaseUrl || "",
    notes: form.notes,
    items: form.items.map((item) => ({
      title: item.title,
      description: item.desc,
      quantity: item.qty,
      unitPrice: item.price,
      isTaxable: true,
    })),
  };

  const { data, error } = props.documentId
    ? await actions.updateDocument(payload)
    : await actions.saveDocument(payload);

  if (error) throw error;
  return data;
};

console.log(props.prefilledData);

// Helper to determine if we are editing an existing record
const isExistingDoc = !!props.prefilledData?.document;

const form = reactive({
  // Use existing doc type, or fall back to prefilled/default
  type: isExistingDoc
    ? props.prefilledData.document?.type ? props.prefilledData.document.type.toUpperCase()
    : props.prefilledData?.type?.toUpperCase() : "RECEIPT",

  number: isExistingDoc ? props.prefilledData.document.documentNumber : "",
  issueDate: isExistingDoc
    ? new Date(props.prefilledData.document.issueDate).toISOString().substr(0, 10)
    : new Date().toISOString().substr(0, 10),

  dueDate:
    isExistingDoc && props.prefilledData.document.dueDate
      ? new Date(props.prefilledData.document.dueDate).toISOString().substr(0, 10)
      : "",

  paymentMethod: props.prefilledData?.document?.paymentMethod || "Cash",

  // Linked IDs
  customerId: props.prefilledData?.customer?.id || "",
  locationId: props.prefilledData?.location?.id || "",

  // Contact Details
  clientName: props.prefilledData?.customer?.name || "",
  address:
    props.prefilledData?.location?.address ||
    props.prefilledData?.customer?.address ||
    "",
  email: props.prefilledData?.customer?.email || "",
  phone: props.prefilledData?.customer?.phone || "",

  notes: isExistingDoc
    ? props.prefilledData.document.notes
    : "1-year warranty on parts and labor",
  promoLabel: props.prefilledData?.document?.promoLabel || "",
  discountType: props.prefilledData?.document?.discountType || "fixed",
  discountValue: props.prefilledData?.document?.discountAmount || 0,
  parentDocumentId: props.prefilledData?.document?.parentDocumentId || null,

  // Map database line items to form structure
  items: isExistingDoc
    ? props.prefilledData.document.items.map((i) => ({
        title: i.title,
        desc: i.description,
        qty: i.quantity,
        price: i.unitPrice,
        isTaxable: i.isTaxable,
      }))
    : [{ title: "", desc: "", qty: 1, price: 0, isTaxable: true }],
});
// Email: Standard alphanumeric with @ and domain
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone: Matches (905) 960-9947, 905-960-9947, or 9059609947
const phoneRegex = /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

const errors = ref({});
const validateForm = () => {
  errors.value = {}; // Reset

  // 1. Client Name (HTML required is good, but JS backup is safer)
  if (!form.clientName?.trim()) {
    errors.value.clientName = "Client name is required.";
  }

  // 2. Email Validation (Optional field, but validate IF filled)
  if (form.email && !emailRegex.test(form.email)) {
    errors.value.email = "Please enter a valid email address.";
  }

  // 3. Phone Validation
  if (!form.phone) {
    errors.value.phone = "Phone number is required.";
  } else if (!phoneRegex.test(form.phone)) {
    errors.value.phone = "Format must be (905) 000-0000";
  }

  // 4. Line Items Check
  if (form.items.length === 0) {
    errors.value.items = "Please add at least one service or part.";
  }

  return Object.keys(errors.value).length === 0;
};

// --- Computed ---
const getPlaceholder = computed(() => {
  if (form.type === "RECEIPT") return "REC-1001";
  if (form.type === "QUOTE") return "QTE-1001";
  return "INV-1001";
});

const subtotal = computed(() => form.items.reduce((s, i) => s + i.qty * i.price, 0));
const calculatedDiscount = computed(() => {
  if (form.discountType === "percent") return subtotal.value * (form.discountValue / 100);
  return form.discountValue || 0;
});
const grandTotal = computed(() => Math.max(0, subtotal.value - calculatedDiscount.value));
const isLocked = computed(() => {
  return isExistingDoc && props.prefilledData.document.status !== "draft";
});

const addItem = () => form.items.push({ title: "", desc: "", qty: 1, price: 0 });
const removeItem = (index) => form.items.length > 1 && form.items.splice(index, 1);

const formTypeChange = async (t) => {
  form.type = t;
  const autoNumber = await getNextDocNumber(form.type);
  form.number = autoNumber; // Update the form state
};

const handleAction = async (mode) => {
  if (!validateForm()) {
    alert("Please fix errors first.");
    return;
  }

  try {
    let firebaseUrl = props.prefilledData?.document?.pdfUrl || "";

    // Only generate PDF if finalizing
    if (mode === "final") {
      const confirmFinal = confirm(
        "Finalizing will lock this document. Generate PDF now?"
      );
      if (!confirmFinal) return;

      firebaseUrl = await generateAndUploadPDF(form, {
        subtotal: subtotal.value,
        discount: calculatedDiscount.value,
        grandTotal: grandTotal.value,
      });
    }

    // Save to DB
    await saveToDatabase(firebaseUrl, mode === "final" ? "sent" : "draft");

    alert(
      mode === "final"
        ? "Document finalized and PDF generated!"
        : "Draft saved successfully."
    );
    window.location.href = "/admin/customers/list";
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
};
</script>

<style scoped>
@import "../../styles/global.css";
.invoice-container {
  padding: 20px;
  background: #0f172a;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  box-sizing: border-box;
}

.invoice-generator {
  background: #1e293b;
  width: 100%;
  max-width: 850px;
  padding: 40px;
  border-radius: 16px;
  border: 1px solid #334155;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  color: #f8fafc;
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  box-sizing: border-box;
}

.header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 40px;
  border-bottom: 1px solid #334155;
  padding-bottom: 30px;
}

.brand h2 {
  color: #f59e0b;
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -1px;
}

.sub-brand {
  font-size: 11px;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 2px;
  font-weight: 600;
}

.doc-toggle {
  display: flex;
  background: #0f172a;
  padding: 4px;
  border-radius: 12px;
}

.doc-toggle button {
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: #64748b;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.doc-toggle button.active {
  background: #f59e0b;
  color: #0f172a;
}

.section-group {
  margin-bottom: 35px;
}

.section-label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 15px;
  letter-spacing: 0.5px;
}

.field-hint {
  font-size: 9px;
  color: #64748b;
  font-weight: 700;
  margin-bottom: 4px;
  display: block;
}

.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.span-all {
  grid-column: 1 / -1;
}

input,
select,
textarea {
  background: #0f172a;
  border: 1px solid #334155;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

/* NEW NOTES STYLE */
.notes-textarea {
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #f59e0b;
}

.item-row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  align-items: center;
}

.item-title {
  flex: 2;
}
.item-desc {
  flex: 4;
}
.item-qty {
  flex: 0.5;
  text-align: center;
}
.item-price {
  flex: 1;
}

.remove-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: none;
  width: 35px;
  height: 42px;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
}

.add-btn {
  background: transparent;
  border: 1px dashed #475569;
  color: #f59e0b;
  font-weight: 700;
  padding: 10px;
  width: 100%;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  margin-top: 5px;
}

.promo-box {
  background: rgba(15, 23, 42, 0.4);
  padding: 20px;
  border-radius: 12px;
  border: 1px dashed #334155;
  margin-bottom: 35px;
}

.promo-grid {
  display: grid;
  grid-template-columns: 2fr 1.5fr;
  gap: 15px;
}

.promo-inputs {
  display: flex;
  gap: 8px;
}

.promo-inputs select {
  width: 70px;
}

.summary-footer {
  border-top: 2px solid #334155;
  padding-top: 30px;
}

.summary-card {
  margin-left: auto;
  max-width: 300px;
  margin-bottom: 25px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #94a3b8;
  font-weight: 500;
}

.total-row {
  border-top: 1px solid #334155;
  padding-top: 15px;
  color: white;
}

.total-amount {
  color: #22c55e;
  font-size: 24px;
  font-weight: 900;
}

.generate-btn {
  text-align: center;
  width: 100%;
  background: #f59e0b;
  color: #0f172a;
  border: none;
  padding: 18px;
  font-size: 15px;
  font-weight: 800;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.3);
  transition: transform 0.1s;
}

.generate-btn:active {
  transform: scale(0.99);
}
.cancel-btn {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  margin: 15px;
  text-align: center;
  letter-spacing: 0.5px;
}
.action-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 15px;
  margin-top: 10px;
}

.save-draft-btn {
  background: transparent;
  color: #94a3b8;
  border: 2px solid #334155;
  padding: 18px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.save-draft-btn:hover {
  background: #334155;
  color: white;
}

.locked-banner {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid #22c55e;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}

.view-final-btn {
  display: inline-block;
  margin-top: 10px;
  background: #22c55e;
  color: #052e16;
  padding: 10px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 800;
}

/* Ensure generate-btn matches your existing style but fills its grid spot */
.generate-btn {
  margin-top: 0; /* Override if needed */
}
@media (max-width: 600px) {
  .invoice-generator {
    padding: 20px;
  }
  .item-row {
    flex-direction: column;
    align-items: stretch;
    gap: 5px;
    background: #0f172a;
    padding: 10px;
    border-radius: 8px;
  }
  .remove-btn {
    width: 100%;
    height: 30px;
  }
  .promo-grid {
    grid-template-columns: 1fr;
  }
}
/* Ensure the custom element is visible */
gmpx-place-autocomplete-element {
  display: block;
  width: 100%;
  min-height: 40px; /* Force visibility */
  margin-top: 4px;
}

/* Styling the actual input inside Google's Shadow DOM */
gmpx-place-autocomplete-element::part(input) {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #e2e8f0; /* Slate-200 */
  border-radius: 8px;
  outline: none;
  transition: all 0.2s ease;
}

/* Hover/Focus states for the internal input */
gmpx-place-autocomplete-element::part(input):focus {
  border-color: #f59e0b; /* Amber-500 */
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
}
</style>
