// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import sanity from '@sanity/astro';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import vue from '@astrojs/vue';




import react from '@astrojs/react';




export default defineConfig({
  site: 'https://yorkgaragepros.com',

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap({
    filter: (page) => {
      if (page.includes('/booking') || page.includes('/thank-you')) {
        return false;
      }

      return true;
    }
  }), sanity({
    projectId: "xgztagdf",
    dataset: "production",
    useCdn: false, // for static builds
  }), vue(), react()],

  output: "static",
  adapter: cloudflare(),
});