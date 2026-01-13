import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 1. CUSTOMERS
export const Customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(),
  phone: text('phone'),
  type: text('type').default('residential'), 
  hstNumber: text('hst_number'),
  // SQLite best practice: Store as integer (Unix timestamp)
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

// 2. LOCATIONS
export const Locations = sqliteTable('locations', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => Customers.id, { onDelete: 'cascade' }),
  
  // Google Core Identity
  placeId: text('place_id'),
  formattedAddress: text('formatted_address').notNull(),
  
  // Precise Location Data
  unit: text('unit'), // Apartment, Suite, etc.
  streetNumber: text('street_number'),
  route: text('route'), // Street Name
  
  // Administrative Breakdown
  neighborHood: text('neighborhood'),
  sublocality: text('sublocality'),
  city: text('city'), // locality
  
  // Admin Areas (State/Province/County)
  adminAreaL1: text('admin_area_l1').default('ON'), // Province/State (e.g., Ontario)
  adminAreaL2: text('admin_area_l2'), // County/Region (e.g., York Region)
  adminAreaL3: text('admin_area_l3'), // Township/Municipality
  adminAreaL4: text('admin_area_l4'), // Smaller local divisions
  
  country: text('country').default('Canada'),
  postalCode: text('postal_code'),
  
  // Geography
  latitude: real('latitude'),
  longitude: real('longitude'),
  
  // Metadata & Custom
  gateCode: text('gate_code'), 
  isBillingAddress: integer('is_billing_address', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// 3. DOCUMENTS
export const Documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').references(() => Customers.id),
  locationId: text('location_id').references(() => Locations.id),
  parentDocumentId: text('parent_document_id'), 
  
  type: text('type').notNull(), // 'quote', 'invoice', 'receipt'
  documentNumber: text('document_number').unique().notNull(),
  status: text('status').default('draft'), // 'draft', 'sent', 'paid', 'void'
  
  subtotal: real('subtotal').notNull(),
  discountAmount: real('discount_amount').default(0),
  promoLabel: text('promo_label'),
  taxAmount: real('tax_amount').notNull(), // HST (13%)
  taxRate: real('tax_rate').notNull(), // HST (13%)
  totalAmount: real('total_amount').notNull(),
  
  paymentMethod: text('payment_method'), // 'etransfer', 'credit_card', 'cash'
  transactionId: text('transaction_id'),
  
  issueDate: integer('issue_date', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  expiryDate: integer('expiry_date', { mode: 'timestamp' }),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  
  pdfUrl: text('pdf_url'),
  notes: text('notes'),
});

// 4. DOCUMENT ITEMS
export const DocumentItems = sqliteTable('document_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  documentId: text('document_id').references(() => Documents.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  quantity: real('quantity').default(1),
  unitPrice: real('unit_price').notNull(),
  lineTotal: real('line_total').notNull(),
  isTaxable: integer('is_taxable', { mode: 'boolean' }).default(true),
});