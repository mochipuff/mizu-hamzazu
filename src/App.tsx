import { useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router';
import { SoundProvider } from './context/SoundProvider.tsx';
import { ToastProvider } from './context/ToastProvider.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { Header } from './components/layout/Header.tsx';
import { AmbientSeeds } from './components/ui/AmbientSeeds.tsx';
import { KonamiStorm } from './components/ui/KonamiStorm.tsx';
import { I18nProvider } from './i18n/I18nProvider.tsx';
import { useI18n } from './i18n/i18n.ts';
import { isLocale, localeFromPath } from './i18n/locales.ts';
import { preferredLocale, usePage } from './i18n/navigation.ts';
import { pageFromPath, pagePath } from './i18n/pages.ts';
import { HomePage } from './pages/HomePage.tsx';
import { SupportsPage } from './pages/SupportsPage.tsx';

/** `/`, `/supports/` and `/xx/` become the same page in a real language. Unknown paths land on the home page, as they always did. */
function RedirectToLocale() {
  const { pathname, search, hash } = useLocation();
  const locale = localeFromPath(pathname) ?? preferredLocale();
  return <Navigate to={`${pagePath(locale, pageFromPath(pathname))}${search}${hash}`} replace />;
}

function Layout() {
  const { t } = useI18n();
  const page = usePage();
  const { hash } = useLocation();
  const previousPage = useRef(page);

  // A new page opens at its top, or at the section named in the URL (`/en/#faq`). The first page the visitor loads is left to the browser.
  useEffect(() => {
    if (previousPage.current === page) return;
    previousPage.current = page;

    const target = document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView({ behavior: 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page, hash]);

  return (
    <>
      <a className="skip-link" href="#main">
        {t.skipLink}
      </a>
      <AmbientSeeds />
      <KonamiStorm />
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}

function LocaleShell() {
  const { locale } = useParams();
  if (!isLocale(locale)) return <RedirectToLocale />;

  return (
    <I18nProvider locale={locale}>
      <SoundProvider>
        <ToastProvider>
          <Layout />
        </ToastProvider>
      </SoundProvider>
    </I18nProvider>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:locale" element={<LocaleShell />}>
          <Route index element={<HomePage />} />
          <Route path="supports" element={<SupportsPage />} />
        </Route>
        <Route path="*" element={<RedirectToLocale />} />
      </Routes>
    </BrowserRouter>
  );
}
