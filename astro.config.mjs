// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import vue from '@astrojs/vue';




import mdx from '@astrojs/mdx';




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
  }), vue(), mdx()],

  output: "static",
  adapter: cloudflare(),
});