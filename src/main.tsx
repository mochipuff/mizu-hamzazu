import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Latin only on purpose: the Japanese subsets are 1 to 1.5 MB each (or hundreds of CSS rules when sliced), so kana, kanji and Hangul use the system fonts listed in --font-cjk-fallback.
import '@fontsource/mochiy-pop-one/latin-400.css';
import '@fontsource/zen-maru-gothic/latin-500.css';
import '@fontsource/zen-maru-gothic/latin-700.css';
import './styles/global.css';
import { App } from './App.tsx';
import { resolveInitialLocale } from './i18n/initial.ts';
import { hideLoader, updateLoader } from './lib/loader.ts';
import { preloadCritical } from './lib/preload.ts';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root was not found.');

// React mounts right away behind the loading screen; the screen only decides when it is revealed.
createRoot(container).render(
  <StrictMode>
    <App initialLocale={resolveInitialLocale()} />
  </StrictMode>,
);

await preloadCritical(updateLoader);
await hideLoader();
