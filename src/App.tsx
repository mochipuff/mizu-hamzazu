import { useEffect, useRef, type ComponentType } from 'react';
import { SoundProvider } from './context/SoundProvider.tsx';
import { ToastProvider } from './context/ToastProvider.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { Header } from './components/layout/Header.tsx';
import { AmbientSeeds } from './components/ui/AmbientSeeds.tsx';
import { KonamiStorm } from './components/ui/KonamiStorm.tsx';
import { I18nProvider } from './i18n/I18nProvider.tsx';
import { useI18n } from './i18n/i18n.ts';
import { usePage } from './i18n/navigation.ts';
import type { PageId } from './i18n/pages.ts';
import { HomePage } from './pages/HomePage.tsx';
import { SupportsPage } from './pages/SupportsPage.tsx';

const pages: Record<PageId, ComponentType> = { home: HomePage, supports: SupportsPage };

function Layout() {
  const { t } = useI18n();
  const page = usePage();
  const Page = pages[page];
  const previousPage = useRef(page);

  // A new page opens at its top, or at the section named in the URL (`/en/#faq`). The first page the visitor loads is left to the browser.
  useEffect(() => {
    if (previousPage.current === page) return;
    previousPage.current = page;

    const target = document.getElementById(window.location.hash.slice(1));
    if (target) target.scrollIntoView({ behavior: 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page]);

  return (
    <>
      <a className="skip-link" href="#main">
        {t.skipLink}
      </a>
      <AmbientSeeds />
      <KonamiStorm />
      <Header />
      <Page />
      <Footer />
    </>
  );
}

export function App() {
  return (
    <I18nProvider>
      <SoundProvider>
        <ToastProvider>
          <Layout />
        </ToastProvider>
      </SoundProvider>
    </I18nProvider>
  );
}
