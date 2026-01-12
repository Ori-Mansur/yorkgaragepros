import { defineAction } from 'astro:actions';
import { randomUUID } from 'node:crypto';
import { z } from 'astro:schema';
import { db } from '../db'; // Your new Turso connection
import { Customers, Locations, DocumentItems, Documents } from '../db/schema';
import { eq, and, count } from 'drizzle-orm';

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
                // UPDATE EXISTING
                await db.update(Customers)
                    .set({ ...customerData })
                    .where(eq(Customers.id, id));

                if (address) {
                    // Check if location exists to update or insert
                    const [existingLoc] = await db.select().from(Locations).where(eq(Locations.customerId, id));
                    if (existingLoc) {
                        await db.update(Locations)
                            .set({ address, city: city || 'Newmarket', postalCode: postalCode || '' })
                            .where(eq(Locations.customerId, id));
                    } else {
                        await db.insert(Locations).values({
                            id: crypto.randomUUID(),
                            customerId: customerId,
                            address, city: city || 'Newmarket', postalCode: postalCode || '',
                            isBillingAddress: true
                        });
                    }
                }
            } else {
                // INSERT NEW
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
            parentDocumentId: z.string().optional().nullable(),
            type: z.enum(['quote', 'invoice', 'receipt']),
            status: z.string().default('draft'),
            pdfUrl: z.string().optional(),
            promoLabel: z.string().optional(),
            items: z.array(z.object({
                title: z.string(),
                description: z.string().optional().default(''),
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

            // 2. Generate Number (Count existing of this type)
            const result = await db.select({ value: count() }).from(Documents).where(eq(Documents.type, input.type));
            const existingCount = result[0].value;
            const prefix = input.type === 'quote' ? 'Q' : input.type === 'invoice' ? 'INV' : 'REC';
            const docNum = `${prefix}-${1000 + existingCount + 1}`;

            // 3. Insert Document Header
            await db.insert(Documents).values({
                id: docId,
                customerId: input.customerId,
                locationId: input.locationId,
                parentDocumentId: input.parentDocumentId,
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
                    .set({ status: 'paid', paidAt: new Date() })
                    .where(eq(Documents.id, input.parentDocumentId));
            }

            // 4. Insert Items
            if (input.items.length > 0) {
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
            }

            return { success: true, id: docId, documentNumber: docNum };
        }
    }),

    updateDocument: defineAction({
        accept: 'json',
        input: z.object({
            id: z.string(),
            status: z.string().optional(),
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
                description: z.string().optional().default(''),
                quantity: z.number(),
                unitPrice: z.number(),
                isTaxable: z.boolean()
            }))
        }),
        handler: async (input) => {
            const [existing] = await db.select().from(Documents).where(eq(Documents.id, input.id));
            if (!existing) throw new Error("Document not found");
            
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
                    // updatedAt can be added to schema if needed
                })
                .where(eq(Documents.id, input.id));

            // Clean and replace items
            await db.delete(DocumentItems).where(eq(DocumentItems.documentId, input.id));

            if (input.items.length > 0) {
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
            }
            
            return { success: true };
        }
    })
};