import type { CSSProperties } from 'react';
import { AsyncBoundary } from '../components/ui/AsyncBoundary.tsx';
import { Star, Sparkle } from '../components/ui/Doodles.tsx';
import { Icon } from '../components/ui/Icon.tsx';
import { ImagePlaceholder, LoadingImage } from '../components/ui/LoadingImage.tsx';
import { Notice } from '../components/ui/Notice.tsx';
import { PopField } from '../components/ui/PopField.tsx';
import { Reveal } from '../components/ui/Reveal.tsx';
import { SectionHeading } from '../components/ui/SectionHeading.tsx';
import { WaveDivider } from '../components/ui/WaveDivider.tsx';
import { useData } from '../data/api.ts';
import { useI18n } from '../i18n/i18n.ts';
import styles from './CollabPage.module.css';

interface Partner {
  id: number;
  name: string;
  avatarUrl: string | null;
  fillUrl: string | null;
  linkUrl: string | null;
  count: number;
}

const PODIUM = 3;
const STARS = [Star, Sparkle] as const;
const AVATAR_TINTS = ['var(--pastel-pink)', 'var(--pastel-butter)', 'var(--pastel-mint)', 'var(--pastel-sky)', 'var(--pastel-lilac)'] as const;

const COLLAB_PATH = '/api/collab/';

/** The loading state of the page: stripes and a hopping paw over the whole screen (under the header, so the menu stays reachable), with a label that glitches. */
function CollabLoading() {
  const { t } = useI18n();

  return (
    <div className={styles.loading} role="status" aria-busy="true">
      <ImagePlaceholder />
      <p className={styles.loadingLabel}>{t.common.loading}</p>
    </div>
  );
}

function PartnerCard({ partner, position }: { partner: Partner; position: number }) {
  const { t } = useI18n();
  const { name, avatarUrl, fillUrl, linkUrl, count } = partner;

  const body = (
    <>
      {fillUrl && <LoadingImage className={styles.fill} src={fillUrl} alt="" loading="lazy" decoding="async" />}
      <span className={styles.rank}>{position}</span>
      {avatarUrl ? (
        <LoadingImage className={styles.avatar} src={avatarUrl} alt="" loading="lazy" decoding="async" />
      ) : (
        <span className={`${styles.avatar} ${styles.initial}`} style={{ '--tint': AVATAR_TINTS[position % AVATAR_TINTS.length] } as CSSProperties} aria-hidden="true">
          {[...name][0]?.toUpperCase()}
        </span>
      )}
      <span className={styles.name}>{name}</span>
      <span className={styles.count}>
        <Icon name="heart" size={16} />
        {t.collab.count(count)}
      </span>
    </>
  );

  return linkUrl ? (
    <a className={styles.card} href={linkUrl} target="_blank" rel="noopener noreferrer" data-podium={position <= PODIUM} data-filled={fillUrl !== null}>
      {body}
    </a>
  ) : (
    <div className={styles.card} data-podium={position <= PODIUM} data-filled={fillUrl !== null}>
      {body}
    </div>
  );
}

// The API already answers highest counter first (ties by name), so the position in the list is the rank.
function PartnerList() {
  const { t } = useI18n();
  const partners = useData<Partner[]>(COLLAB_PATH);

  if (partners.length === 0) return <Notice kind="empty">{t.common.empty}</Notice>;

  return (
    <ol className={styles.list} aria-label={t.collab.listLabel}>
      {partners.map((partner, index) => (
        <li key={partner.id}>
          <Reveal variant="pop" delay={(index % 3) * 90}>
            <PartnerCard partner={partner} position={index + 1} />
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

export function CollabPage() {
  const { t } = useI18n();
  const { collab } = t;

  return (
    <>
      <PopField shapes={STARS} />
      <main id="main">
        <section className={styles.section} aria-labelledby="collab-title">
          <div className="container">
            <SectionHeading headingId="collab-title" title={collab.title} as="h1">
              {collab.lead}
            </SectionHeading>

            <AsyncBoundary fallback={<CollabLoading />}>
              <PartnerList />
            </AsyncBoundary>
          </div>
        </section>
      </main>
      <WaveDivider color="var(--ink)" />
    </>
  );
}
