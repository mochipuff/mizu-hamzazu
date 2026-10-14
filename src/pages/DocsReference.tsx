import { ApiReferenceReact } from '@scalar/api-reference-react';
// The stylesheet is 330 KB. Imported as text it stays inside this page's chunk, instead of being merged into the site's one stylesheet (`cssCodeSplit: false`).
import scalarStyles from '@scalar/api-reference-react/style.css?inline';
import { useEffect, useMemo } from 'react';
import { REALTIME_URL } from '../context/realtime.ts';
import { buildOpenApi } from '../data/openapi.ts';

// Scalar's variables, filled with the site's own (global.css), so the reference looks like the rest of the site.
const THEME_CSS = `
.scalar-app, .light-mode, .dark-mode {
  --scalar-font: var(--font-body);
  --scalar-font-code: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --scalar-background-1: var(--foam);
  --scalar-background-2: var(--shallows);
  --scalar-background-3: var(--sand);
  --scalar-background-accent: var(--sun-soft);
  --scalar-color-1: var(--ink);
  --scalar-color-2: var(--ink-soft);
  --scalar-color-3: var(--ink-soft);
  --scalar-color-accent: var(--rust);
  --scalar-border-color: var(--ink);
  --scalar-button-1: var(--sun);
  --scalar-button-1-color: var(--ink);
  --scalar-button-1-hover: var(--coral);
  --scalar-sidebar-background-1: var(--white);
  --scalar-sidebar-color-1: var(--ink);
  --scalar-sidebar-color-2: var(--ink-soft);
  --scalar-sidebar-border-color: var(--ink);
  --scalar-sidebar-item-hover-background: var(--shallows);
  --scalar-sidebar-item-active-background: var(--sun-soft);
  --scalar-sidebar-color-active: var(--ink);
  --scalar-color-green: var(--leaf);
  --scalar-color-red: var(--crimson);
  --scalar-color-orange: var(--rust);
  --scalar-color-yellow: var(--drop);
  --scalar-radius: 12px;
  --scalar-radius-lg: 16px;
  --scalar-radius-xl: 22px;
  --scalar-custom-header-height: 5rem;
}
`;

/** Loaded on demand by DocsPage so the 1 MB reference never reaches a visitor of the other pages. */
export default function DocsReference() {
  const configuration = useMemo(
    () => ({
      content: buildOpenApi(window.location.origin, REALTIME_URL ?? ''),
      theme: 'none' as const,
      customCss: THEME_CSS,
      layout: 'modern' as const,
      // Nothing is fetched from a third party: no web fonts, no request proxy, no telemetry, no MCP integration.
      withDefaultFonts: false,
      telemetry: false,
      mcp: { disabled: true },
      showDeveloperTools: 'never' as const,
      hideClientButton: true,
      hideDownloadButton: true,
      hideDarkModeToggle: true,
      forceDarkModeState: 'light' as const,
      persistAuth: false,
      defaultOpenFirstTag: true,
    }),
    [],
  );

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = scalarStyles;
    document.head.append(style);
    return () => style.remove();
  }, []);

  return <ApiReferenceReact configuration={configuration} />;
}
