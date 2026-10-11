import { useEffect, useState } from 'react';
import { load } from '../../data/api.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { localeInfo } from '../../i18n/locales.ts';
import { Button } from '../ui/Button.tsx';
import { Reveal } from '../ui/Reveal.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';
import { Heart } from '../ui/Stickers.tsx';
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

const COLUMNS = 3;

export function Fanart() {
  const { t, locale } = useI18n();
  const { fanart } = t.supports;
  const language = localeInfo[locale].htmlLang;
  const [feed, setFeed] = useState<Feed>({ posts: [], page: 0, hasMore: true, status: 'loading' });

  // Page 1 loads with the section, every further page only when "Load more" is clicked.
  const loadPage = (page: number) => {
    setFeed((current) => ({ ...current, status: 'loading' }));
    load<{ posts: FanartPost[]; hasMore: boolean }>(`/api/fanart/${page}/`).then(
      ({ posts, hasMore }) => setFeed((current) => (current.page >= page ? current : { posts: [...current.posts, ...posts], page, hasMore, status: 'idle' })),
      () => setFeed((current) => ({ ...current, status: 'error' })),
    );
  };

  useEffect(() => loadPage(1), []);

  if (feed.status === 'idle' && feed.posts.length === 0) return null;

  const formatDate = new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format;

  return (
    <section id="fanart" className={styles.section} aria-labelledby="fanart-title">
      <div className="container">
        <SectionHeading headingId="fanart-title" title={fanart.title}>
          {fanart.lead}
        </SectionHeading>

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

        {feed.status === 'error' && (
          <p className="load-error" role="alert">
            {t.common.loadFailed}
          </p>
        )}
        {feed.hasMore && feed.status !== 'loading' && (
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
