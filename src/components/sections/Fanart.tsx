import { useEffect, useState, type ReactNode } from 'react';
import { load } from '../../data/api.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { localeInfo } from '../../i18n/locales.ts';
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
  left: string;
  size: number;
  tilt: number;
}

const COLUMNS = 3;
const SHAPES = [Flower, Cloud, Pin, Paw, Heart] as const;
const DECORATION_COUNT = 14;

const between = (min: number, max: number): number => min + Math.random() * (max - min);

// Scattered along the two edges of the section, behind the grid, so they frame the art without ever covering it.
const createDecorations = (): Decoration[] =>
  Array.from({ length: DECORATION_COUNT }, (_, id) => {
    const size = between(28, 56);
    const edge = between(0, 4);
    return {
      id,
      Shape: SHAPES[Math.floor(Math.random() * SHAPES.length)] ?? Heart,
      top: between(1, 95),
      left: Math.random() < 0.5 ? `${edge}%` : `calc(${100 - edge}% - ${size}px)`,
      size,
      tilt: between(-25, 25),
    };
  });

export function Fanart() {
  const { t, locale } = useI18n();
  const { fanart } = t.supports;
  const language = localeInfo[locale].htmlLang;
  const [feed, setFeed] = useState<Feed>({ posts: [], page: 0, hasMore: true, status: 'loading' });
  const [decorations] = useState(createDecorations);

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
      <div className={styles.decor} aria-hidden="true">
        {decorations.map(({ id, Shape, top, left, size, tilt }) => (
          <span key={id} className={styles.deco} style={{ top: `${top}%`, left, width: size, rotate: `${tilt}deg` }}>
            <Shape />
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
