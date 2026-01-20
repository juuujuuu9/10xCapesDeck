// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  server: {
    host: true, // Listen on all interfaces (allows both localhost and 127.0.0.1)
    port: 4321, // Explicit port
  },
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react()]
});