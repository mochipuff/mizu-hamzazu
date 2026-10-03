import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { seoPlugin } from './vite/seoPlugin.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), seoPlugin(env.VITE_SITE_URL ?? '')],
    build: {
      target: 'es2023',
      cssCodeSplit: false,
    },
  };
});
