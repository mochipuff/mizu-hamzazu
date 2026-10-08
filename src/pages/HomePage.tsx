import { About } from '../components/sections/About.tsx';
import { Emotes } from '../components/sections/Emotes.tsx';
import { Faq } from '../components/sections/Faq.tsx';
import { Hero } from '../components/sections/Hero.tsx';
import { Join } from '../components/sections/Join.tsx';
import { Schedule } from '../components/sections/Schedule.tsx';
import { Marquee } from '../components/ui/Marquee.tsx';
import { WaveDivider } from '../components/ui/WaveDivider.tsx';
import { useI18n } from '../i18n/i18n.ts';

export function HomePage() {
  const { t } = useI18n();

  return (
    <>
      <main id="main">
        <Hero />
        <About />
        <Schedule />
        <Emotes />
        <Marquee items={t.marquee} tone="sun" tilt={-1.5} />
        <Join />
        <Faq />
      </main>
      <WaveDivider color="var(--ink)" />
    </>
  );
}
