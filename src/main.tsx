import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/mochiy-pop-one/latin-400.css';
import '@fontsource/zen-maru-gothic/latin-500.css';
import '@fontsource/zen-maru-gothic/latin-700.css';
import './styles/global.css';
import { App } from './App.tsx';
import { hideLoader, updateLoader } from './lib/loader.ts';
import { ScrollTrigger } from './lib/motion.ts';
import { preloadAssets } from './lib/preload.ts';

const MIN_LOADER_MS = 600;

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root was not found.');

// Keep the loader up long enough to read as intentional, even when everything is cached.
const minimumTime = new Promise((resolve) => window.setTimeout(resolve, Math.max(0, MIN_LOADER_MS - performance.now())));

await Promise.all([preloadAssets(updateLoader), minimumTime]);

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

await hideLoader();
// Fonts and images are in, so measure every scroll animation again.
ScrollTrigger.refresh();
