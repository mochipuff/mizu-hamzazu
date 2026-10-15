import type { CSSProperties } from 'react';
import { AsyncBoundary } from '../components/ui/AsyncBoundary.tsx';
import { ImagePlaceholder, LoadingImage, SkeletonLines } from '../components/ui/LoadingImage.tsx';
import { Icon } from '../components/ui/Icon.tsx';
import { Notice } from '../components/ui/Notice.tsx';
import { Reveal } from '../components/ui/Reveal.tsx';
import { SectionHeading } from '../components/ui/SectionHeading.tsx';
import { StarField } from '../components/ui/StarField.tsx';
import { WaveDivider } from '../components/ui/WaveDivider.tsx';
import { useData } from '../data/api.ts';
import { useI18n } from '../i18n/i18n.ts';
import styles from './CollabPage.module.css';

interface Partner {
  id: number;
  name: string;
  avatarUrl: string | null;
  linkUrl: string | null;
  count: number;
}

const SKELETON_COUNT = 6;
const PODIUM = 3;
const AVATAR_TINTS = ['var(--pastel-pink)', 'var(--pastel-butter)', 'var(--pastel-mint)', 'var(--pastel-sky)', 'var(--pastel-lilac)'] as const;

const COLLAB_PATH = '/api/collab/';

function PartnerSkeleton() {
  const { t } = useI18n();

  return (
    <ol className={styles.list} aria-busy="true" aria-label={t.common.loading}>
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <li key={index}>
          <div className={`${styles.card} ${styles.pending}`} aria-hidden="true">
            <span className={styles.avatar}>
              <ImagePlaceholder />
            </span>
            <SkeletonLines />
          </div>
        </li>
      ))}
    </ol>
  );
}

function PartnerCard({ partner, position }: { partner: Partner; position: number }) {
  const { t } = useI18n();
  const { name, avatarUrl, linkUrl, count } = partner;

  const body = (
    <>
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
    <a className={styles.card} href={linkUrl} target="_blank" rel="noopener noreferrer" data-podium={position <= PODIUM}>
      {body}
    </a>
  ) : (
    <div className={styles.card} data-podium={position <= PODIUM}>
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
      <StarField />
      <main id="main">
        <section className={styles.section} aria-labelledby="collab-title">
          <div className="container">
            <SectionHeading headingId="collab-title" title={collab.title} as="h1">
              {collab.lead}
            </SectionHeading>

            <AsyncBoundary fallback={<PartnerSkeleton />}>
              <PartnerList />
            </AsyncBoundary>
          </div>
        </section>
      </main>
      <WaveDivider color="var(--ink)" />
    </>
  );
}
