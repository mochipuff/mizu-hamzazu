import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { seoPlugin } from './vite/seoPlugin.ts';

/** VITE_SITE_URL wins; on Vercel the production domain is used when it is not set, so social embeds always get absolute URLs. */
const resolveSiteUrl = (env: Record<string, string>): string => {
  if (env.VITE_SITE_URL) return env.VITE_SITE_URL;
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercelHost ? `https://${vercelHost}` : '';
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), seoPlugin(resolveSiteUrl(env))],
    build: {
      target: 'es2023',
      cssCodeSplit: false,
    },
  };
});
