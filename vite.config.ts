import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // keep asset references relative so the build works from any subpath
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
