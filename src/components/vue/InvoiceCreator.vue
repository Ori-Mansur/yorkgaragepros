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

        <button class="generate-btn" @click="generateAndSave">
          GENERATE {{ form.type }} PDF
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive, computed } from "vue";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
// Import the service we just created
import { saveDocToCloud, getNextDocNumber } from "../../js/dbDocService";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

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

/**
 * Handles the background upload process without
 * cluttering the PDF design logic.
 */
const uploadPdfToFirebase = async (pdfDoc) => {
  try {
    // 1. Prepare the Filename
    const fileName = `${form.type}_${form.number || "NoNumber"}`;

    // 2. Convert jsPDF instance to a Blob (Binary Large Object)
    // This is the actual file format needed for Firebase Storage
    const pdfBlob = pdfDoc.output("blob");

    // 3. Collect the data from the form state
    const dbData = {
      ...form, // All form fields
      grandTotal: grandTotal.value,
      discountValue: calculatedDiscount.value,
    };

    // 4. Call our Step 1 service
    const cloudId = await saveDocToCloud(dbData, pdfBlob, fileName);

    console.log("Cloud Upload Successful. ID:", cloudId);
    return cloudId;
  } catch (error) {
    console.error("Cloud Upload Failed:", error);
    throw error; // Pass the error up so the UI can show an alert
  }
};

// 1. IMPORT THE FONT FILE
import "../../utils/Montserrat-Bold.js";
import "../../utils/Montserrat.js";

const form = reactive({
  type: "RECEIPT",
  number: "",
  issueDate: new Date().toISOString().substr(0, 10),
  dueDate: "",
  paymentMethod: "Cash",
  clientName: "John Dear",
  address: "123 Main st, Newmarket",
  email: "ddd@gg.v",
  phone: "123456789",
  notes: "6 Months",
  promoLabel: "Boxing Day",
  discountType: "fixed",
  discountValue: 100,
  items: [{ desc: "Torsion Spring", qty: 1, price: 325 }],
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

// --- Business Info ---
const business = {
  phone: "(905) 960-9947", // Update with your real business phone
  email: "info@yorkgaragepros.com",
  website: "yorkgaragepros.com",
  address: "Newmarket, ON L3X 2B1"
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

const addItem = () => form.items.push({ desc: "", qty: 1, price: 0 });
const removeItem = (index) => form.items.length > 1 && form.items.splice(index, 1);

const formTypeChange = async (t) => {
  form.type = t;
  const autoNumber = await getNextDocNumber(form.type);
  form.number = autoNumber; // Update the form state
};
formTypeChange(form.type);
const getLogoBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
  });
};

// --- PDF Generation ---
const generateAndSave = async () => {
  console.log(form);

  if (!validateForm()) {
    alert(
      "Please fix the errors before generating the document." +
        JSON.stringify(errors.value)
    );
    console.table(errors.value);
    return; // Stop the function here
  }
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const primaryAmber = [245, 158, 11];
  const deepSlate = [30, 41, 59];

  // 1. HEADER & LOGO
  doc.setFillColor(deepSlate[0], deepSlate[1], deepSlate[2]);
  doc.rect(0, 0, 600, 120, "F");
  doc.setFillColor(primaryAmber[0], primaryAmber[1], primaryAmber[2]);
  doc.rect(0, 120, 600, 5, "F");

  const logoData = await getLogoBase64("/logoonly-removebg-preview.png");
  if (logoData) {
    doc.setFillColor(220, 220, 220);
    doc.roundedRect(38, 23, 64, 64, 8, 8, "F");
    doc.addImage(logoData, "PNG", 40, 25, 60, 60);
  }

  // 2. FONTS & COMPANY INFO
  try {
    doc.setFont("Montserrat-Bold", "bold");
  } catch (e) {
    doc.setFont("Montserrat", "bold");
  }

  const textStartX = logoData ? 115 : 40;
  //   doc.setFontSize(20).setTextColor(255, 255, 255);
  doc.setFontSize(20).setTextColor(primaryAmber[0], primaryAmber[1], primaryAmber[2]);
  doc.text("YORK GARAGE PROS", textStartX, 50);

  doc.setFontSize(8).setTextColor(200, 200, 200);
  doc.text(`${business.website} | ${business.email}`, textStartX, 63);
  doc.text(`${business.phone} | ${business.address}`, textStartX, 73);

  // Business Contacts in Header
  //   doc.setFontSize(9).setTextColor(245, 158, 11); // Amber

  //   doc.setFontSize(9).setTextColor(primaryAmber[0]);
  //   doc.text(`Phone: ${business.phone}`, textStartX, 85);
  //   doc.text(`Email: ${business.email}`, textStartX, 98);

  doc.setFontSize(24).setTextColor(255, 255, 255);
  doc.text(form.type, 550, 75, { align: "right" });

  // 3. CLIENT DETAILS & DOCUMENT INFO
  let clientY = 160;
  let clientHeader = "BILL TO:"; // Default for Invoice
  if (form.type === "RECEIPT") {
    clientHeader = "CUSTOMER DETAILS:";
  } else if (form.type === "QUOTE") {
    clientHeader = "PROPOSAL FOR:";
  }

  doc.setTextColor(deepSlate[0]).setFontSize(10).setFont("Montserrat-Bold", "bold");
  doc.text(clientHeader, 40, clientY);

  doc.setFont("Montserrat-Bold", "bold").setFontSize(11).setTextColor(0);
  doc.text(form.clientName || "Valued Customer", 40, clientY + 15);

  doc.setFont("Montserrat", "normal").setFontSize(9).setTextColor(80);
  const clientLines = [form.address, form.phone, form.email].filter(Boolean);
  doc.text(clientLines, 40, clientY + 30);

  // Right Side: Doc Info
  const infoX = 420;
  doc.setFont("Montserrat-Bold", "bold").setFontSize(10).setTextColor(deepSlate[0]);
  doc.text("DOCUMENT INFO:", infoX, clientY);
  doc.setFont("Montserrat", "normal").setFontSize(9).setTextColor(80);
  doc.text(`${form.type} #: ${form.number || "---"}`, infoX, clientY + 15);
  doc.text(`Date: ${form.issueDate}`, infoX, clientY + 30);

  if (form.type !== "RECEIPT" && form.dueDate) {
    const dueDateLabel = `${form.type === "QUOTE" ? "Valid Until" : "Due Date"}: ${
      form.dueDate
    }`;
    doc.text(dueDateLabel, infoX, clientY + 45);
  } else if (form.type === "RECEIPT") {
    doc.setFont("Montserrat-Bold", "bold").setTextColor(34, 197, 94);
    doc.text(`PAID VIA: ${form.paymentMethod.toUpperCase()}`, infoX, clientY + 45);
  }

  // 4. THE TABLE
  autoTable(doc, {
    startY: 300,
    head: [["DESCRIPTION", "QTY", "PRICE", "TOTAL"]],
    body: form.items.map((i) => [
      i.desc,
      i.qty,
      `$${Number(i.price).toFixed(2)}`,
      `$${(i.qty * i.price).toFixed(2)}`,
    ]),
    theme: "striped",
    headStyles: { fillColor: deepSlate, font: "Montserrat-Bold", fontStyle: "bold" },
    styles: { font: "Montserrat", fontSize: 9 },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
  });

  // 5. TOTALS SECTION
  // --- 5. POSITIONING THE SUMMARY SECTION ---
  // Get the page height (A4 is ~842pt)
  const pageHeight = doc.internal.pageSize.height;
  const pageMidPoint = pageHeight / 2 + 100;

  // If the table ends above the midpoint, jump to the midpoint.
  // If the table is long and goes past the midpoint, start 30pt below the table.
  let finalY = Math.max(doc.lastAutoTable.finalY + 30, pageMidPoint);

  doc.setFont("Montserrat", "normal").setFontSize(10).setTextColor(80);
  doc.text("Subtotal:", 365, finalY + 10);
  doc.text(`$${subtotal.value.toFixed(2)}`, 550, finalY + 10, { align: "right" });

  doc.setFont("Montserrat-Bold", "bold").setFontSize(10).setTextColor(80);
  doc.text(`Discount (${form.promoLabel || "Promo"}):`, 365, finalY + 25);
  doc.text(`-$${calculatedDiscount.value.toFixed(2)}`, 550, finalY + 25, {
    align: "right",
  });

  /* FUTURE HST LINE - Commented out for now
  doc.text("HST (13%):", 400, finalY + 40);
  doc.text(`$${(grandTotal.value * 0.13).toFixed(2)}`, 550, finalY + 40, { align: 'right' });
  */

  // Total Box
  doc.setFillColor(primaryAmber[0], primaryAmber[1], primaryAmber[2]);
  doc.roundedRect(350, finalY + 45, 210, 45, 8, 8, "F");
  doc
    .setFont("Montserrat-Bold", "bold")
    .setFontSize(12)
    .setTextColor(deepSlate[0], deepSlate[1], deepSlate[2]);
  const totalLabel =
    form.type === "RECEIPT"
      ? "TOTAL PAID"
      : form.type === "QUOTE"
      ? "ESTIMATED TOTAL"
      : "TOTAL DUE";
  doc.text(totalLabel, 365, finalY + 73);
  doc.text(`$${grandTotal.value.toFixed(2)}`, 550, finalY + 73, { align: "right" });

  // 6. NOTES SECTION
  if (form.notes) {
    const notesY = finalY + 180;
    doc.setFont("Montserrat-Bold", "bold").setFontSize(10).setTextColor(deepSlate[0]);
    doc.text("NOTES & REMARKS:", 40, notesY);
    doc.setFont("Montserrat", "normal").setFontSize(9).setTextColor(80);
    const splitNotes = doc.splitTextToSize(form.notes, 520);
    doc.text(splitNotes, 40, notesY + 15);
  }

  // 7. SAVE
  doc.save(`${form.type}_${form.number || "Draft"}.pdf`);

  // 8. Trigger the cloud upload in the background
  try {
    await uploadPdfToFirebase(doc);
    alert("Document saved to cloud and downloaded!");
  } catch (err) {
    alert("Downloaded locally, but failed to save to database.");
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

.item-desc {
  flex: 3;
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
