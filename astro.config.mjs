// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import sanity from '@sanity/astro';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import vue from '@astrojs/vue';




export default defineConfig({
  site: 'https://yorkgaragepros.com',

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap(), sanity({
    projectId: "xgztagdf",
    dataset: "production",
    useCdn: false, // for static builds
  }), vue()],

  output: "static",
  adapter: cloudflare(),
});