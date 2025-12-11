// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import sanity from '@sanity/astro';

import tailwindcss from '@tailwindcss/vite';
import partytown from '@astrojs/partytown';


export default defineConfig({
    site: 'https://yorkgaragepros.com',
    vite: {
        plugins: [tailwindcss()],
    },
    integrations: [sitemap(), partytown({
        config: {
            forward: ["dataLayer.push"],
        }
    }), sanity({
        projectId: "xgztagdf",
        dataset: "production",
        useCdn: false, // for static builds
    })],
    output: "static",


});