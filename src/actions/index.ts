import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { db, Customers, Locations, eq } from 'astro:db';


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
    })
};