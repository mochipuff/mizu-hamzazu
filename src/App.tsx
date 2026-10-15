import { useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';
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
import { ContentPage } from './pages/ContentPage.tsx';
import { ForbiddenPage } from './pages/ForbiddenPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { SupportsPage } from './pages/SupportsPage.tsx';

const PAGE_KEY = 'mizu:page';

function KeepPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const checked = useRef(false);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(PAGE_KEY);
      const savedLocale = saved ? localeFromPath(saved) : null;
      const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];

      const firstCheck = !checked.current;
      checked.current = true;
      if (firstCheck && entry?.type === 'reload' && saved && savedLocale && saved !== pathname) {
        void navigate(pagePath(savedLocale, pageFromPath(saved)), { replace: true });
        return;
      }
      window.sessionStorage.setItem(PAGE_KEY, pathname);
    } catch {
    }
  }, [pathname, navigate]);

  return null;
}

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
      <KeepPage />
      <Routes>
        <Route path="/:locale" element={<LocaleShell />}>
          <Route index element={<HomePage />} />
          <Route path="supports" element={<SupportsPage />} />
          <Route path="content" element={<ContentPage />} />
          <Route path="forbidden" element={<ForbiddenPage />} />
        </Route>
        <Route path="*" element={<RedirectToLocale />} />
      </Routes>
    </BrowserRouter>
  );
}
