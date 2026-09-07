import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative, so the built asset URLs resolve against whatever path the page is
  // served from. GitHub Pages puts this project site under /kindkeys/, but the
  // same build also works from a domain root — nothing here needs to know its
  // own address. (Vite treats a relative base as "/" for the dev server.)
  base: './',
  plugins: [react()],
  server: { port: 5173 },
});
