// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import sanity from '@sanity/astro';

import tailwindcss from '@tailwindcss/vite';




import react from '@astrojs/react';




import cloudflare from '@astrojs/cloudflare';




export default defineConfig({
  site: 'https://yorkgaragepros.com',

  vite: {
      plugins: [tailwindcss()],
  },

  integrations: [sitemap(), sanity({
      projectId: "xgztagdf",
      dataset: "production",
      useCdn: false, // for static builds
  }), react()],

  output: "static",
  adapter: cloudflare(),
});