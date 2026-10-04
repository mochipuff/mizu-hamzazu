import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/mochiy-pop-one/latin-400.css';
import '@fontsource/zen-maru-gothic/latin-500.css';
import '@fontsource/zen-maru-gothic/latin-700.css';
import './styles/global.css';
import { App } from './App.tsx';
import { hideLoader, updateLoader } from './lib/loader.ts';
import { preloadCritical } from './lib/preload.ts';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root was not found.');

await preloadCritical(updateLoader);

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

await hideLoader();
