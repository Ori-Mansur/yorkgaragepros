// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import image from "@astrojs/image";

export default defineConfig({
    site: 'https://yorkgaragepros.com',
    integrations: [sitemap(), image()],
    // ...
});