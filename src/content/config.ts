// src/content/config.ts

import { z, defineCollection } from 'astro:content';

// 1. Town pages (/{town}/). One file per town we have real jobs to show for.
// The file name is the URL slug, e.g. richmond-hill.mdx -> /richmond-hill/
const towns = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    title: z.string(),
    h1: z.string(),
    metaDescription: z.string(),
    // Keep false until real job details/photos are added. While false the page
    // is noindex and excluded from the sitemap (see astro.config.mjs).
    published: z.boolean(),
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
    rating: z.number().optional(),
    reviewCount: z.number().optional(),

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
    windowStyles: z.array(z.string()).optional(),
  }),
});
const blog = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().max(160),
    publishDate: z.date(),
    author: z.string().default('York Garage Pros'),

    // Updated: Array of objects with image validation and alt text
    images: z.array(
      z.object({
        url: image(), // Validates the file path
        alt: z.string(), // Ensures you provide SEO alt text
      })
    ).min(1),

    category: z.enum(['Repair', 'Installation', 'Maintenance', 'Safety', 'Deal Alert','Troubleshooting']),
    location: z.string(),
    serviceType: z.string(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean()
  }),
});


// 3. Export both collections
export const collections = {
  towns,
  'service-catalogs': serviceCatalogsCollection,
  blog
};