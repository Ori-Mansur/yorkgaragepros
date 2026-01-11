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
            // Adding location fields to the input schema
            address: z.string().optional().nullable(),
            city: z.string().optional().nullable(),
            postalCode: z.string().optional().nullable(),
        }),
        handler: async (input) => {
            const { id, address, city, postalCode, ...customerData } = input;
            const customerId = id || crypto.randomUUID();

            if (id) {
                // UPDATE Existing Customer
                await db.update(Customers)
                    .set(customerData)
                    .where(eq(Customers.id, id));

                // Update Location if it exists
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
                // CREATE New Customer
                await db.insert(Customers).values({
                    id: customerId,
                    ...customerData,
                });

                // CREATE Location if provided
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
            type: z.enum(['quote', 'invoice', 'receipt']),
            items: z.array(z.object({
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
            let subtotal = 0;
            input.items.forEach(item => {
                subtotal += (item.quantity * item.unitPrice);
            });

            const taxableAmount = input.items
                .filter(i => i.isTaxable)
                .reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);

            const hstRate = 0.13; // York Region / Ontario HST
            const taxAmount = (taxableAmount - input.discountAmount) * hstRate;
            const totalAmount = subtotal - input.discountAmount + taxAmount;

            // 2. Generate a Document Number (e.g., Q-1001 or INV-1001)
            const count = await db.select().from(Documents).all();
            const prefix = input.type === 'quote' ? 'Q' : input.type === 'invoice' ? 'INV' : 'REC';
            const docNum = `${prefix}-${1000 + count.length + 1}`;

            // 3. Insert Document Header
            await db.insert(Documents).values({
                id: docId,
                customerId: input.customerId,
                locationId: input.locationId,
                type: input.type,
                documentNumber: docNum,
                subtotal,
                taxAmount,
                discountAmount: input.discountAmount,
                totalAmount,
                notes: input.notes,
                status: 'draft',
                issueDate: new Date()
            });

            // 4. Insert Line Items
            for (const item of input.items) {
                await db.insert(DocumentItems).values({
                    documentId: docId,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    lineTotal: item.quantity * item.unitPrice,
                    isTaxable: item.isTaxable
                });
            }

            return { success: true, id: docId, documentNumber: docNum };
        }
    })
};