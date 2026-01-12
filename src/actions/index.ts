import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { db, Customers, Locations, DocumentItems, Documents, eq } from 'astro:db';

export const server = {
    saveCustomer: defineAction({
        accept: 'json',
        input: z.object({
            id: z.string().optional().nullable(),
            name: z.string(),
            email: z.string().email(),
            phone: z.string(),
            type: z.string(),
            hstNumber: z.string().optional().nullable(),
            address: z.string().optional().nullable(),
            city: z.string().optional().nullable(),
            postalCode: z.string().optional().nullable(),
        }),
        handler: async (input) => {
            const { id, address, city, postalCode, ...customerData } = input;
            const customerId = id || crypto.randomUUID();

            if (id) {
                await db.update(Customers)
                    .set(customerData)
                    .where(eq(Customers.id, id));

                if (address) {
                    await db.insert(Locations).values({
                        id: crypto.randomUUID(),
                        customerId: customerId,
                        address, city: city || 'Newmarket', postalCode: postalCode || '',
                        isBillingAddress: true
                    }).onConflictDoUpdate({
                        target: Locations.customerId,
                        set: { address, city, postalCode }
                    });
                }
            } else {
                await db.insert(Customers).values({
                    id: customerId,
                    ...customerData,
                });

                if (address) {
                    await db.insert(Locations).values({
                        id: crypto.randomUUID(),
                        customerId: customerId,
                        address,
                        city: city || 'Newmarket',
                        postalCode: postalCode || '',
                        isBillingAddress: true
                    });
                }
            }
            return { success: true, id: customerId };
        }
    }),

    saveDocument: defineAction({
        accept: 'json',
        input: z.object({
            customerId: z.string(),
            locationId: z.string().optional().nullable(),
            parentDocumentId: z.string().optional().nullable(), // Added link for Quote->Inv or Inv->Rec
            type: z.enum(['quote', 'invoice', 'receipt']),
            status: z.string().default('draft'), // Added status control
            pdfUrl: z.string(),
            promoLabel: z.string(),
            items: z.array(z.object({
                title: z.string(),
                description: z.string(),
                quantity: z.number(),
                unitPrice: z.number(),
                isTaxable: z.boolean().default(true)
            })),
            notes: z.string().optional(),
            discountAmount: z.number().default(0)
        }),
        handler: async (input) => {
            const docId = crypto.randomUUID();

            // 1. Calculate Financials
            const subtotal = input.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
            const taxableAmount = input.items
                .filter(i => i.isTaxable)
                .reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);

            const hstRate = 0.13;
            const taxAmount = Math.max(0, (taxableAmount - input.discountAmount) * hstRate);
            const totalAmount = subtotal - input.discountAmount + taxAmount;

            // 2. Generate Number
            const existingDocs = await db.select().from(Documents).where(eq(Documents.type, input.type)).all();
            const prefix = input.type === 'quote' ? 'Q' : input.type === 'invoice' ? 'INV' : 'REC';
            const docNum = `${prefix}-${1000 + existingDocs.length + 1}`;

            // 3. Insert Document Header
            await db.insert(Documents).values({
                id: docId,
                customerId: input.customerId,
                locationId: input.locationId,
                parentDocumentId: input.parentDocumentId, // Link stored here
                type: input.type,
                documentNumber: docNum,
                pdfUrl: input.pdfUrl,
                subtotal,
                taxAmount,
                discountAmount: input.discountAmount,
                totalAmount,
                notes: input.notes,
                promoLabel: input.promoLabel,
                status: input.status,
                issueDate: new Date()
            });

            // Logic: If this is a Receipt, mark the parent Invoice as Paid
            if (input.type === 'receipt' && input.parentDocumentId) {
                await db.update(Documents)
                    .set({ status: 'paid' })
                    .where(eq(Documents.id, input.parentDocumentId));
            }

            // 4. Insert Items
            const lineItems = input.items.map(item => ({
                documentId: docId,
                title: item.title,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                lineTotal: item.quantity * item.unitPrice,
                isTaxable: item.isTaxable
            }));

            await db.insert(DocumentItems).values(lineItems);

            return { success: true, id: docId, documentNumber: docNum };
        }
    }),

    updateDocument: defineAction({
        accept: 'json',
        input: z.object({
            id: z.string(),
            status: z.string().optional(), // Allow updating status (e.g., draft -> sent)
            customerId: z.string(),
            locationId: z.string().optional().nullable(),
            type: z.string(),
            subtotal: z.number(),
            taxAmount: z.number(),
            discountAmount: z.number(),
            totalAmount: z.number(),
            pdfUrl: z.string().optional(),
            notes: z.string().optional(),
            promoLabel: z.string().optional(),
            items: z.array(z.object({
                title: z.string(),
                description: z.string(),
                quantity: z.number(),
                unitPrice: z.number(),
                isTaxable: z.boolean()
            }))
        }),
        handler: async (input) => {
            const [existing] = await db.select().from(Documents).where(eq(Documents.id, input.id));
            if (!existing) throw new Error("Document not found");
            
            // Allow update if it's a draft OR if we are specifically moving it to 'sent'/'paid'
            if (existing.status !== 'draft' && !input.status) {
                throw new Error("Only Draft documents can be modified.");
            }

            await db.update(Documents)
                .set({
                    locationId: input.locationId,
                    status: input.status || existing.status,
                    subtotal: input.subtotal,
                    taxAmount: input.taxAmount,
                    discountAmount: input.discountAmount,
                    totalAmount: input.totalAmount,
                    pdfUrl: input.pdfUrl,
                    notes: input.notes,
                    updatedAt: new Date()
                })
                .where(eq(Documents.id, input.id));

            await db.delete(DocumentItems).where(eq(DocumentItems.documentId, input.id));

            const newLineItems = input.items.map(item => ({
                documentId: input.id,
                title: item.title,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                lineTotal: item.quantity * item.unitPrice,
                isTaxable: item.isTaxable
            }));

            await db.insert(DocumentItems).values(newLineItems);
            return { success: true };
        }
    })
};