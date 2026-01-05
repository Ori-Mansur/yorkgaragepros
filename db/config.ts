import { defineDb, defineTable, column, NOW } from 'astro:db';

// 1. CUSTOMERS: The parent entity
const Customers = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    name: column.text(), // Individual or Business Name
    email: column.text({ unique: true }),
    phone: column.text(),
    type: column.text({ default: 'residential' }), // 'residential', 'commercial', 'landlord'
    hstNumber: column.text({ optional: true }), // If they are a business claiming tax back
    createdAt: column.date({ default: NOW }),
  }
});

// 2. LOCATIONS: Where the garage door is actually located
const Locations = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    customerId: column.text({ references: () => Customers.columns.id }),
    address: column.text(),
    city: column.text({ default: 'Newmarket' }),
    postalCode: column.text(),
    gateCode: column.text({ optional: true }), // Useful for technician access
    isBillingAddress: column.boolean({ default: false }),
  }
});

// 3. DOCUMENTS: The core of your billing system
const Documents = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    customerId: column.text({ references: () => Customers.columns.id }),
    locationId: column.text({ references: () => Locations.columns.id }),
    
    // Linking: Quote -> Invoice -> Receipt
    // When you convert a Quote to an Invoice, store the Quote ID here
    parentDocumentId: column.text({ optional: true }), 
    
    type: column.text(), // 'quote', 'invoice', 'receipt'
    documentNumber: column.text({ unique: true }), // e.g. "INV-2025-001"
    
    // Status Logic
    status: column.text({ default: 'draft' }), // 'draft', 'sent', 'paid', 'void'
    
    // Financials
    subtotal: column.number(),
    discountAmount: column.number({ default: 0 }),
    taxAmount: column.number(), // HST (13% in Ontario)
    totalAmount: column.number(),
    
    // Payment Tracking
    paymentMethod: column.text({ optional: true }), // 'etransfer', 'credit_card', 'cash'
    transactionId: column.text({ optional: true }), // From Stripe or E-transfer memo
    
    // Key Dates
    issueDate: column.date({ default: NOW }),
    dueDate: column.date({ optional: true }), // Mandatory for Invoices
    expiryDate: column.date({ optional: true }), // Mandatory for Quotes
    paidAt: column.date({ optional: true }), // Mandatory for Receipts
    
    // File Storage
    pdfUrl: column.text({ optional: true }),
    notes: column.text({ optional: true }), // Internal or customer-facing notes
  }
});

// 4. DOCUMENT ITEMS: The line items for parts and labor
const DocumentItems = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    documentId: column.text({ references: () => Documents.columns.id }),
    description: column.text(), // e.g. "LiftMaster 8500W Installation"
    quantity: column.number({ default: 1 }),
    unitPrice: column.number(),
    lineTotal: column.number(),
    isTaxable: column.boolean({ default: true }), // Some items might be tax-exempt
  }
});

export default defineDb({
  tables: { Customers, Locations, Documents, DocumentItems }
});