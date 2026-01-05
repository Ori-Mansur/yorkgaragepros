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
      if (page.includes('/booking') || page.includes('/thank-you') || page.includes('/admin')) {
        return false;
      }

      return true;
    }
  }), vue({
      template: {
        compilerOptions: {
          // Tell Astro's Vue compiler to treat gmp- tags as custom elements
          isCustomElement: (tag) => tag.startsWith('gmp-')
        }
      }
    }), mdx()],

  output: "static",
  adapter: cloudflare(),
  build: {
    // Inline all CSS into the HTML if it's smaller than 10kb
    inlineStylesheets: 'always',
  },
});