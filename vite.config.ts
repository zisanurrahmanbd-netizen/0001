import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/0001/',
  build: {
    outDir: 'dist',
  },
});