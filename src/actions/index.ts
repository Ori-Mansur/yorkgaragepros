import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { db } from '../db';
import { Customers, Locations, DocumentItems, Documents } from '../db/schema';
import { eq, count } from 'drizzle-orm';
import { randomUUID } from 'node:crypto'; // Safer for server-side environments

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
            const customerId = id || randomUUID();

            if (id) {
                await db.update(Customers)
                    .set({ ...customerData })
                    .where(eq(Customers.id, id));

                if (address) {
                    const [existingLoc] = await db.select().from(Locations).where(eq(Locations.customerId, id));
                    if (existingLoc) {
                        await db.update(Locations)
                            .set({ address, city: city || 'Newmarket', postalCode: postalCode || '' })
                            .where(eq(Locations.customerId, id));
                    } else {
                        await db.insert(Locations).values({
                            id: randomUUID(),
                            customerId: id,
                            address, city: city || 'Newmarket', postalCode: postalCode || '',
                            isBillingAddress: true
                        });
                    }
                }
            } else {
                await db.insert(Customers).values({
                    id: customerId,
                    ...customerData,
                });

                if (address) {
                    await db.insert(Locations).values({
                        id: randomUUID(),
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
            type: z.enum(['QUOTE', 'INVOICE', 'RECEIPT', 'REFUND']),
            status: z.string().default('draft'),
            pdfUrl: z.string().optional(),
            promoLabel: z.string().optional(),
            // Changed to match your Frontend: qty and price
            items: z.array(z.object({
                title: z.string(),
                desc: z.string().optional().default(''),
                qty: z.number(),
                price: z.number(),
                isTaxable: z.boolean().default(true)
            })),
            notes: z.string().optional(),
            discountValue: z.number().default(0),
            taxRate: z.number().default(13), // Added this
        }),
        handler: async (input) => {
            const docId = randomUUID();

            // 1. Calculate Financials using the taxRate from the UI
            const subtotal = input.items.reduce((sum, i) => sum + (i.qty * i.price), 0);
            const taxableAmount = input.items
                .filter(i => i.isTaxable)
                .reduce((sum, i) => sum + (i.qty * i.price), 0);

            // TRUST the input taxRate (convert 13 to 0.13)
            const hstRate = input.taxRate / 100;

            const taxAmount = Math.max(0, (taxableAmount - input.discountValue) * hstRate);
            const totalAmount = subtotal - input.discountValue + taxAmount;

            // 2. Generate Number 
            const countRes = await db.select({ value: count() }).from(Documents).where(eq(Documents.type, input.type));
            const existingCount = countRes[0]?.value ?? 0;
            const prefix = input.type === 'QUOTE' ? 'Q' : input.type === 'INVOICE' ? 'INV' : 'REC';
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
                discountAmount: input.discountValue,
                taxRate: input.taxRate, // Save the specific rate used
                totalAmount: input.type === 'REFUND' ? -Math.abs(totalAmount) : totalAmount,
                notes: input.notes,
                promoLabel: input.promoLabel,
                status: input.status,
                issueDate: new Date()
            });

            // 4. Insert Items (Mapping qty -> quantity and price -> unitPrice for DB)
            if (input.items.length > 0) {
                const lineItems = input.items.map(item => ({
                    documentId: docId,
                    title: item.title,
                    description: item.desc,
                    quantity: item.qty,
                    unitPrice: item.price,
                    lineTotal: item.qty * item.price,
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
            id: z.string(), // Required for updates
            customerId: z.string(),
            locationId: z.string().optional().nullable(),
            type: z.enum(['QUOTE', 'INVOICE', 'RECEIPT', 'REFUND']),
            status: z.string(),
            pdfUrl: z.string().optional(),
            promoLabel: z.string().optional(),
            items: z.array(z.object({
                title: z.string(),
                desc: z.string().optional().default(''),
                qty: z.number(),
                price: z.number(),
                isTaxable: z.boolean().default(true)
            })),
            notes: z.string().optional(),
            discountValue: z.number().default(0),
            taxRate: z.number().default(13),
        }),
        handler: async (input) => {
            // 1. Re-calculate Financials based on updated input
            const subtotal = input.items.reduce((sum, i) => sum + (i.qty * i.price), 0);
            const taxableAmount = input.items
                .filter(i => i.isTaxable)
                .reduce((sum, i) => sum + (i.qty * i.price), 0);

            const hstRate = input.taxRate / 100;
            const taxAmount = Math.max(0, (taxableAmount - input.discountValue) * hstRate);
            const totalAmount = subtotal - input.discountValue + taxAmount;

            // 2. Update Document Header
            await db.update(Documents)
                .set({
                    pdfUrl: input.pdfUrl,
                    subtotal,
                    taxAmount,
                    taxRate: input.taxRate,
                    discountAmount: input.discountValue,
                    totalAmount: input.type === 'REFUND' ? -Math.abs(totalAmount) : totalAmount,
                    notes: input.notes,
                    promoLabel: input.promoLabel,
                    status: input.status,
                    updatedAt: new Date()
                })
                .where(eq(Documents.id, input.id));

            // 3. Sync Line Items (Delete existing and re-insert new ones)
            await db.delete(DocumentItems).where(eq(DocumentItems.documentId, input.id));

            if (input.items.length > 0) {
                const lineItems = input.items.map(item => ({
                    documentId: input.id,
                    title: item.title,
                    description: item.desc,
                    quantity: item.qty,
                    unitPrice: item.price,
                    lineTotal: item.qty * item.price,
                    isTaxable: item.isTaxable
                }));
                await db.insert(DocumentItems).values(lineItems);
            }

            return { success: true };
        }
    })
};