import { getContactEmail } from './config/site.ts';
import { SoundProvider } from './context/SoundProvider.tsx';
import { ToastProvider } from './context/ToastProvider.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { Header } from './components/layout/Header.tsx';
import { About } from './components/sections/About.tsx';
import { Contact } from './components/sections/Contact.tsx';
import { Emotes } from './components/sections/Emotes.tsx';
import { Faq } from './components/sections/Faq.tsx';
import { Hero } from './components/sections/Hero.tsx';
import { Join } from './components/sections/Join.tsx';
import { Schedule } from './components/sections/Schedule.tsx';
import { AmbientSeeds } from './components/ui/AmbientSeeds.tsx';
import { KonamiStorm } from './components/ui/KonamiStorm.tsx';
import { Marquee } from './components/ui/Marquee.tsx';
import { WaveDivider } from './components/ui/WaveDivider.tsx';
import { I18nProvider } from './i18n/I18nProvider.tsx';
import { useI18n } from './i18n/i18n.ts';
import type { Locale } from './i18n/locales.ts';

function Page() {
  const { t } = useI18n();
  const contactEmail = getContactEmail();

  return (
    <>
      <a className="skip-link" href="#main">
        {t.skipLink}
      </a>
      <AmbientSeeds />
      <KonamiStorm />
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Schedule />
        <Emotes />
        <Marquee items={t.marquee} tone="sun" tilt={-1.5} />
        <Join />
        <Faq />
        {contactEmail && <Contact email={contactEmail} />}
      </main>
      <WaveDivider color="var(--ink)" />
      <Footer />
    </>
  );
}

export function App({ initialLocale }: { initialLocale: Locale }) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <SoundProvider>
        <ToastProvider>
          <Page />
        </ToastProvider>
      </SoundProvider>
    </I18nProvider>
  );
}
