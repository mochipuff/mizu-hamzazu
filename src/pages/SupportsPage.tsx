import { SupportsCover } from '../components/sections/SupportsCover.tsx';
import { TopDonations } from '../components/sections/TopDonations.tsx';
import { ViewerNotes } from '../components/sections/ViewerNotes.tsx';
import { Marquee } from '../components/ui/Marquee.tsx';
import { WaveDivider } from '../components/ui/WaveDivider.tsx';
import { useI18n } from '../i18n/i18n.ts';

export function SupportsPage() {
  const { t } = useI18n();

  return (
    <>
      <main id="main">
        <SupportsCover />
        <Marquee items={t.supports.marquee} tone="sun" tilt={-1.5} />
        <TopDonations />
        <ViewerNotes />
      </main>
      <WaveDivider color="var(--ink)" />
    </>
  );
}
