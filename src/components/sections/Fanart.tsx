import { useEffect, useRef, useState, type ReactNode } from 'react';
import { load } from '../../data/api.ts';
import { useGsap } from '../../hooks/useGsap.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { localeInfo } from '../../i18n/locales.ts';
import { gsap, IDLE, POP } from '../../lib/motion.ts';
import { Button } from '../ui/Button.tsx';
import { Paw } from '../ui/Doodles.tsx';
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

interface Feed {
  posts: FanartPost[];
  page: number;
  hasMore: boolean;
  status: 'idle' | 'loading' | 'error';
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
const SHAPES = [Flower, Cloud, Pin, Paw, Heart] as const;
const SIZES = [44, 36, 40, 32] as const;
const TILTS = [-14, 10, -6, 16, -18, 8] as const;
const DECORATION_COUNT = 14;
// How far each sticker drifts against the scroll, in px. They cycle, so neighbours move at different speeds.
const PARALLAX = [30, 55, 40, 70] as const;

// A fixed zigzag down the two edges of the section, behind the grid: same spot on every visit, never two stickers side by side, never covering the art.
const decorations: Decoration[] = Array.from({ length: DECORATION_COUNT }, (_, id) => ({
  id,
  Shape: SHAPES[id % SHAPES.length] ?? Heart,
  top: 3 + id * (92 / DECORATION_COUNT),
  side: id % 2 === 0 ? 'left' : 'right',
  size: SIZES[id % SIZES.length] ?? 36,
  tilt: TILTS[id % TILTS.length] ?? 0,
}));

export function Fanart() {
  const { t, locale } = useI18n();
  const { fanart } = t.supports;
  const language = localeInfo[locale].htmlLang;
  const [feed, setFeed] = useState<Feed>({ posts: [], page: 0, hasMore: true, status: 'loading' });
  const decorRef = useRef<HTMLDivElement>(null);

  // Each layer owns different properties, so the three animations never fight over a transform (same idea as StreamDecor).
  // Scroll: the stickers pop in the first time the section is seen, then drift at their own speed as it scrolls past.
  // Idle: each one flies a small loop of its own, drifting towards the content, so none moves in lockstep.
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

  // Page 1 loads with the section, every older page only when "Load more" is clicked.
  const loadPage = (page: number) => {
    setFeed((current) => ({ ...current, status: 'loading' }));
    load<{ posts: FanartPost[]; hasMore: boolean }>(`/api/fanart/${page}/`).then(
      ({ posts, hasMore }) => setFeed((current) => (current.page >= page ? current : { posts: [...current.posts, ...posts], page, hasMore, status: 'idle' })),
      () => setFeed((current) => ({ ...current, status: 'error' })),
    );
  };

  useEffect(() => loadPage(1), []);

  const formatDate = new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format;
  const gallery = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: fanart.title,
    hasPart: feed.posts.map(({ username, mediaUrl, postedAt }) => ({
      '@type': 'ImageObject',
      contentUrl: mediaUrl,
      name: fanart.alt(username),
      creator: { '@type': 'Person', name: `@${username}` },
      creditText: `@${username}`,
      uploadDate: postedAt,
    })),
  };

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

        {feed.posts.length > 0 && (
          <>
            <ul className={styles.grid} aria-label={fanart.listLabel}>
              {feed.posts.map(({ id, username, mediaUrl, postedAt }, index) => (
                <li key={id} className={styles.slot}>
                  <Reveal variant="pop" delay={(index % COLUMNS) * 90}>
                    <figure className={styles.card}>
                      <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className={styles.photo}>
                        <img src={mediaUrl} alt={fanart.alt(username)} loading="lazy" decoding="async" />
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
            </ul>
            <script type="application/ld+json">{JSON.stringify(gallery).replace(/</g, '\\u003c')}</script>
          </>
        )}

        {feed.status === 'error' && <Notice kind="error">{t.common.loadFailed}</Notice>}
        {feed.status === 'idle' && feed.posts.length === 0 && <Notice kind="empty">{t.common.empty}</Notice>}
        {feed.posts.length > 0 && feed.hasMore && feed.status !== 'loading' && (
          <div className={styles.more}>
            <Button variant="secondary" icon="heart" onClick={() => loadPage(feed.page + 1)}>
              {fanart.loadMore}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
