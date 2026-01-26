// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import vue from '@astrojs/vue';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://yorkgaragepros.com',
  output: "server", // Enables dynamic SSR
  adapter: cloudflare({
    imageService: 'cloudflare' // Uses Cloudflare's native resizer
  }),

  vite: {
    plugins: [tailwindcss()],
    build: {
      cssCodeSplit: true,
      minify: 'esbuild',
    },
    ssr: {
      noExternal: ['@astrojs/vue']
    }
  },

  integrations: [
    sitemap({
      filter: (page) => !['/booking', '/thank-you', '/admin'].some(path => page.includes(path))
    }), 
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('gmp-')
        }
      }
    }), 
    mdx()
  ],

  image: {
    service: {
      entrypoint: 'astro/assets/services/external' 
    }
  },
  
  compressHTML: true,
});
// // @ts-check
// import { defineConfig } from 'astro/config';
// import sitemap from '@astrojs/sitemap';
// import tailwindcss from '@tailwindcss/vite';
// import cloudflare from '@astrojs/cloudflare';
// import vue from '@astrojs/vue';




// import mdx from '@astrojs/mdx';




// export default defineConfig({
//   site: 'https://yorkgaragepros.com',

//   vite: {
//     plugins: [tailwindcss()],
//   },

//   integrations: [sitemap({
//     filter: (page) => {
//       if (page.includes('/booking') || page.includes('/thank-you') || page.includes('/admin')) {
//         return false;
//       }

//       return true;
//     }
//   }), vue({
//       template: {
//         compilerOptions: {
//           // Tell Astro's Vue compiler to treat gmp- tags as custom elements
//           isCustomElement: (tag) => tag.startsWith('gmp-')
//         }
//       }
//     }), mdx()],

//   output: "static",
//   adapter: cloudflare(),
//   build: {
//     // Inline all CSS into the HTML if it's smaller than 10kb
//     inlineStylesheets: 'always',
//   },
// });
// @ts-check
// import { defineConfig } from 'astro/config';
// import sitemap from '@astrojs/sitemap';
// import tailwindcss from '@tailwindcss/vite';
// import cloudflare from '@astrojs/cloudflare';
// import vue from '@astrojs/vue';
// import mdx from '@astrojs/mdx';

// export default defineConfig({
//   site: 'https://yorkgaragepros.com',

//   vite: {
//     plugins: [tailwindcss()],
//     build: {
//       // ADD THESE FOR SPEED:
//       cssCodeSplit: true,        // Split CSS per page
//       minify: 'esbuild',         // Fast minification
//       rollupOptions: {
//         output: {
//           manualChunks: {
//             // Separate vendor JS from your code
//             'vendor': ['vue']
//           }
//         }
//       }
//     },
//     // ADD THIS - Speed up dev server and builds:
//     ssr: {
//       noExternal: ['@astrojs/vue']
//     }
//   },

//   integrations: [
//     sitemap({
//       filter: (page) => {
//         if (page.includes('/booking') || page.includes('/thank-you') || page.includes('/admin')) {
//           return false;
//         }
//         return true;
//       }
//     }), 
//     vue({
//       template: {
//         compilerOptions: {
//           isCustomElement: (tag) => tag.startsWith('gmp-')
//         }
//       }
//     }), 
//     mdx()
//   ],

//   output: "static",
//   adapter: cloudflare(),
  
//   build: {
//     // CHANGE FROM 'always' to 'auto' - Better performance
//     inlineStylesheets: 'auto',  // Only inline small CSS, not everything
    
//     // ADD THIS - Reduce asset size:
//     assets: '_astro',
//     assetsPrefix: undefined
//   },
  
//   // ADD THIS BLOCK - Image optimization:
//   image: {
//     service: {
//       entrypoint: 'astro/assets/services/sharp'
//     },
//     domains: [],
//     remotePatterns: []
//   },
  
//   // ADD THIS - Enable compression:
//   compressHTML: true,
  
//   // ADD THIS - Prefetch for faster navigation:
//   prefetch: {
//     prefetchAll: false,  // Don't prefetch everything
//     defaultStrategy: 'hover'  // Prefetch on hover
//   }
// });