import { SoundProvider } from './context/SoundProvider.tsx';
import { ToastProvider } from './context/ToastProvider.tsx';
import { marqueeLines } from './data/content.ts';
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

export function App() {
  return (
    <SoundProvider>
      <ToastProvider>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <AmbientSeeds />
        <KonamiStorm />
        <Header />
        <main id="main">
          <Hero />
          <About />
          <Schedule />
          <Emotes />
          <Marquee items={marqueeLines} tone="sun" tilt={-1.5} />
          <Join />
          <Faq />
          <Contact />
        </main>
        <WaveDivider color="var(--ink)" />
        <Footer />
      </ToastProvider>
    </SoundProvider>
  );
}
