import { SoundProvider } from './context/SoundProvider.tsx';
import { ToastProvider } from './context/ToastProvider.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { Header } from './components/layout/Header.tsx';
import { AmbientSeeds } from './components/ui/AmbientSeeds.tsx';
import { KonamiStorm } from './components/ui/KonamiStorm.tsx';
import { I18nProvider } from './i18n/I18nProvider.tsx';
import { useI18n } from './i18n/i18n.ts';
import type { Locale } from './i18n/locales.ts';
import { HomePage } from './pages/HomePage.tsx';

function Layout() {
  const { t } = useI18n();

  return (
    <>
      <a className="skip-link" href="#main">
        {t.skipLink}
      </a>
      <AmbientSeeds />
      <KonamiStorm />
      <Header />
      <HomePage />
      <Footer />
    </>
  );
}

export function App({ initialLocale }: { initialLocale: Locale }) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <SoundProvider>
        <ToastProvider>
          <Layout />
        </ToastProvider>
      </SoundProvider>
    </I18nProvider>
  );
}
