// src/content/config.ts

import { z, defineCollection } from 'astro:content';

// 1. Service Areas Collection (Existing)
const serviceAreaCollection = defineCollection({
  type: 'content',
  schema: z.object({
    city: z.string(),
    region: z.string(),
    logo: z.string().optional(),
    service: z.string(),
    cityName: z.string(),
    serviceName: z.string(),
    title: z.string(),
    h1: z.string(),
    metaDescription: z.string(),
    coordinates: z.object({
      lat: z.number(), lng: z.number()
    })
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
    cardTitle: z.string().optional(),
    h1: z.string(),
    metaDescription: z.string(),

    // Specific Product Data (using the Dornett PDF data)
    features: z.array(z.object({
      name: z.string(),
      value: z.string(),
    })).optional(),
    colors: z.array(z.object({
      name: z.string(),
      color: z.string(),
    })).optional(),
    glassStyles: z.array(z.string()).optional(),
  }),
});
const openersCollection = defineCollection({
  type: 'content', // Required for MDX files with frontmatter
  schema: z.object({
    title: z.string(),
    opener: z.string(),
    brand: z.string(),
    type: z.enum(['belt-drive', 'chain-drive', 'wall-mount']), // Add more types if needed
    inStock: z.boolean(),
    priceRange: z.string().optional(),
    price: z.number().optional(), // Use if you have a single price instead of range
    sku: z.string().optional(),
    categories: z.array(z.string()).optional(),
    description: z.string(),
    features: z.array(z.string()),
    image: z.string().optional(), // Path to hero image
  }),
});
const openers = defineCollection({
  type: 'data', // Important: tells Astro this collection uses JSON/YAML, not Markdown
  schema: z.object({
    model: z.string(),
    name: z.string(),
    brand: z.string(),
    description: z.string(),
    shortDescription: z.string(),
    features: z.array(z.string()),
    specifications: z.object({
      motor: z.string(),
      mechanics: z.string(),
      power: z.string(),
      speed: z.string(),
      lighting: z.string(),
      railOptions: z.array(z.object({
        height: z.string(),
        installedLength: z.string(),
        maxOpening: z.string(),
      })),
      headroomRequired: z.string(),
      warranties: z.object({
        motor: z.string().optional(),
        parts: z.string().optional(),
      }),
    }),
    inTheBox: z.array(z.string()),
    images: z.array(z.object({
      url: z.string(),
      alt: z.string(),
      type: z.string(),
    })),
    pdfGuide: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
    available: z.boolean(),
  }),
});


// 3. Export both collections
export const collections = {
  openers: openers,
  'service-areas': serviceAreaCollection,
  'service-catalogs': serviceCatalogsCollection, // <-- The new collection
};