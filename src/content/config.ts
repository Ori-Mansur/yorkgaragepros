// src/content/config.ts

import { z, defineCollection } from 'astro:content';

// 1. Service Areas Collection (Existing)
const serviceAreaCollection = defineCollection({
  type: 'content', 
  schema: z.object({
    city: z.string(),
    logo: z.string(),
    service: z.string(),
    cityName: z.string(),
    serviceName: z.string(),
    title: z.string(),
    h1: z.string(),
    metaDescription: z.string(),
  }),
});

// 2. NEW: Service Catalogs Collection Schema
const serviceCatalogsCollection = defineCollection({
    type: 'content', // Use 'content' as we will include a body (MDX content)
    schema: z.object({
        // The service this catalog belongs to (e.g., 'garage-door', 'opener-service')
        service: z.string(), 
        // The unique slug for the type (e.g., 'flush-panels', 'liftmaster')
        type: z.string(), // <--- THIS IS THE REQUIRED FIELD
        
        // SEO Fields for the Dynamic Page
        title: z.string(),
        h1: z.string(),
        metaDescription: z.string(),

        // Specific Product Data (using the Dornett PDF data)
        features: z.array(z.object({
            name: z.string(),
            value: z.string(),
        })).optional(),
        colors: z.array(z.object({ name: z.string(),
            color: z.string(),})).optional(),
        glassStyles: z.array(z.string()).optional(),
    }),
});


// 3. Export both collections
export const collections = {
  'service-areas': serviceAreaCollection,
  'service-catalogs': serviceCatalogsCollection, // <-- The new collection
};