import { useRef, useState, useTransition, type ReactNode } from 'react';
import { useData } from '../../data/api.ts';
import { useGsap } from '../../hooks/useGsap.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { localeInfo } from '../../i18n/locales.ts';
import { gsap, IDLE, POP } from '../../lib/motion.ts';
import { AsyncBoundary, LoadFailure } from '../ui/AsyncBoundary.tsx';
import { Button } from '../ui/Button.tsx';
import { Paw } from '../ui/Doodles.tsx';
import { ImagePlaceholder, LoadingImage, SkeletonLines } from '../ui/LoadingImage.tsx';
import { Notice } from '../ui/Notice.tsx';
import { Reveal } from '../ui/Reveal.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';
import { Cloud, Flower, Heart, Pin } from '../ui/Stickers.tsx';
import styles from './Fanart.module.css';

interface FanartPost {
  id: number;
  username: string;
  mediaUrl: string;
  postedAt: string;
}

interface FanartResponse {
  posts: FanartPost[];
  hasMore: boolean;
}

interface Decoration {
  id: number;
  Shape: (props: { className?: string }) => ReactNode;
  top: number;
  side: 'left' | 'right';
  size: number;
  tilt: number;
}

const COLUMNS = 3;
const SKELETON_COUNT = 9;
const SHAPES = [Flower, Cloud, Pin, Paw, Heart] as const;
const SIZES = [44, 36, 40, 32] as const;
const TILTS = [-14, 10, -6, 16, -18, 8] as const;
const DECORATION_COUNT = 14;
const PARALLAX = [30, 55, 40, 70] as const;

const decorations: Decoration[] = Array.from({ length: DECORATION_COUNT }, (_, id) => ({
  id,
  Shape: SHAPES[id % SHAPES.length] ?? Heart,
  top: 3 + id * (92 / DECORATION_COUNT),
  side: id % 2 === 0 ? 'left' : 'right',
  size: SIZES[id % SIZES.length] ?? 36,
  tilt: TILTS[id % TILTS.length] ?? 0,
}));

const pagePath = (page: number): string => `/api/fanart/${page}/`;

function FanartSkeleton() {
  return Array.from({ length: SKELETON_COUNT }, (_, index) => (
    <li key={index} className={styles.slot}>
      <div className={`${styles.card} ${styles.pending}`} aria-hidden="true">
        <span className={styles.photo}>
          <ImagePlaceholder />
        </span>
        <SkeletonLines />
      </div>
    </li>
  ));
}

function FanartPage({ page }: { page: number }) {
  const { t, locale } = useI18n();
  const { fanart } = t.supports;
  const { posts } = useData<FanartResponse>(pagePath(page));

  const formatDate = new Intl.DateTimeFormat(localeInfo[locale].htmlLang, { dateStyle: 'medium' }).format;
  const gallery = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: fanart.title,
    hasPart: posts.map(({ username, mediaUrl, postedAt }) => ({
      '@type': 'ImageObject',
      contentUrl: mediaUrl,
      name: fanart.alt(username),
      creator: { '@type': 'Person', name: `@${username}` },
      creditText: `@${username}`,
      uploadDate: postedAt,
    })),
  };

  return (
    <>
      {posts.map(({ id, username, mediaUrl, postedAt }, index) => (
        <li key={id} className={styles.slot}>
          <Reveal variant="pop" delay={(index % COLUMNS) * 90}>
            <figure className={styles.card}>
              <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                <LoadingImage className={styles.photo} src={mediaUrl} alt={fanart.alt(username)} loading="lazy" decoding="async" />
              </a>
              <figcaption className={styles.caption}>
                <span className={styles.username}>@{username}</span>
                <time className={styles.date} dateTime={postedAt}>
                  {formatDate(new Date(postedAt))}
                </time>
              </figcaption>
              <Heart className={styles.heart} />
            </figure>
          </Reveal>
        </li>
      ))}
      <script type="application/ld+json">{JSON.stringify(gallery).replace(/</g, '\\u003c')}</script>
    </>
  );
}

function LoadMore({ page, busy, onMore }: { page: number; busy: boolean; onMore: () => void }) {
  const { t } = useI18n();
  const { hasMore } = useData<FanartResponse>(pagePath(page));
  if (!hasMore) return null;

  return (
    <div className={styles.more}>
      <Button variant="secondary" icon="heart" disabled={busy} onClick={onMore}>
        {t.supports.fanart.loadMore}
      </Button>
    </div>
  );
}

function Feed() {
  const { t } = useI18n();
  const [pages, setPages] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [loadingMore, startTransition] = useTransition();
  const { posts } = useData<FanartResponse>(pagePath(1));

  if (posts.length === 0) return <Notice kind="empty">{t.common.empty}</Notice>;

  return (
    <>
      <ul className={styles.grid} aria-label={t.supports.fanart.listLabel}>
        {Array.from({ length: pages }, (_, index) => (
          <AsyncBoundary
            key={index}
            fallback={<FanartSkeleton />}
            failure={(retry) => (
              <li className={styles.wide}>
                <LoadFailure
                  retry={() => {
                    retry();
                    setAttempt((current) => current + 1);
                  }}
                />
              </li>
            )}
          >
            <FanartPage page={index + 1} />
          </AsyncBoundary>
        ))}
      </ul>
      <AsyncBoundary key={pages} resetKey={attempt} fallback={null} failure={() => null}>
        <LoadMore page={pages} busy={loadingMore} onMore={() => startTransition(() => setPages((current) => current + 1))} />
      </AsyncBoundary>
    </>
  );
}

export function Fanart() {
  const { t } = useI18n();
  const { fanart } = t.supports;
  const decorRef = useRef<HTMLDivElement>(null);

  useGsap(decorRef, () => {
    const section = decorRef.current?.closest('section');
    if (!section) return;

    gsap.from('[data-layer="pop"]', {
      scale: 0,
      rotation: -60,
      opacity: 0,
      duration: 0.8,
      ease: POP,
      stagger: 0.07,
      scrollTrigger: { trigger: section, start: 'top 80%', once: true },
    });

    gsap.utils.toArray<HTMLElement>('[data-layer="parallax"]').forEach((layer, index) => {
      const reach = PARALLAX[index % PARALLAX.length] ?? 0;
      gsap.fromTo(layer, { y: -reach }, { y: reach, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
    });

    gsap.utils.toArray<HTMLElement>('[data-layer="float"]').forEach((layer, index) => {
      const inward = index % 2 === 0 ? 1 : -1;
      const reach = 10 + (index % 4) * 4;
      const leg = 1.6 + (index % 3) * 0.4;
      gsap.to(layer, {
        keyframes: [
          { x: inward * reach, y: -reach, rotation: 14, duration: leg },
          { x: inward * reach * 0.3, y: reach * 0.7, rotation: -12, duration: leg },
          { x: 0, y: 0, rotation: 0, duration: leg },
        ],
        easeEach: IDLE,
        repeat: -1,
        delay: index * 0.2,
      });
    });
  });

  return (
    <section id="fanart" className={styles.section} aria-labelledby="fanart-title">
      <div ref={decorRef} className={styles.decor} aria-hidden="true">
        {decorations.map(({ id, Shape, top, side, size, tilt }) => (
          <span key={id} className={styles.deco} style={{ top: `${top}%`, [side]: 0, width: size, rotate: `${tilt}deg` }}>
            <span className={styles.layer} data-layer="pop">
              <span className={styles.layer} data-layer="parallax">
                <span className={styles.layer} data-layer="float">
                  <Shape />
                </span>
              </span>
            </span>
          </span>
        ))}
      </div>

      <div className={`container ${styles.content}`}>
        <SectionHeading headingId="fanart-title" title={fanart.title}>
          {fanart.lead}
        </SectionHeading>

        <AsyncBoundary
          fallback={
            <ul className={styles.grid} aria-busy="true" aria-label={t.common.loading}>
              <FanartSkeleton />
            </ul>
          }
        >
          <Feed />
        </AsyncBoundary>
      </div>
    </section>
  );
}
