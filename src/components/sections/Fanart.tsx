import { useState, useTransition } from 'react';
import { useData } from '../../data/api.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { localeInfo } from '../../i18n/locales.ts';
import { AsyncBoundary, LoadFailure } from '../ui/AsyncBoundary.tsx';
import { Button, ButtonLink } from '../ui/Button.tsx';
import { ImagePlaceholder, LoadingImage, SkeletonLines } from '../ui/LoadingImage.tsx';
import { Modal } from '../ui/Modal.tsx';
import { Notice } from '../ui/Notice.tsx';
import { PopField } from '../ui/PopField.tsx';
import { Reveal } from '../ui/Reveal.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';
import { Flower, Heart } from '../ui/Stickers.tsx';
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

const COLUMNS = 3;
// The API serves 9 posts a page, so the placeholders fill the same grid and nothing jumps when the first page arrives.
const SKELETON_COUNT = 9;
const BLOOMS = [Flower, Heart] as const;
const BLOOM_COLORS = ['var(--pastel-pink)', 'var(--pastel-lilac)', 'var(--pastel-butter)', 'var(--pastel-mint)', 'var(--pastel-sky)'] as const;
const BLOOM_COUNT = 22;

const pagePath = (page: number): string => `/api/fanart/${page}/`;

/** Cards in the shape of the real ones, one page of them, while the API answers. */
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

/** The cards of one page of the API. Reading the page suspends the nearest boundary until it has arrived. */
function FanartPage({ page, onPreview }: { page: number; onPreview: (post: FanartPost) => void }) {
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
      {posts.map((post, index) => {
        const { id, username, mediaUrl, postedAt } = post;
        return (
          <li key={id} className={styles.slot}>
            <Reveal variant="pop" delay={(index % COLUMNS) * 90}>
              <figure className={styles.card}>
                <button type="button" className={styles.link} aria-label={fanart.view(username)} onClick={() => onPreview(post)}>
                  <LoadingImage className={styles.photo} src={mediaUrl} alt={fanart.alt(username)} loading="lazy" decoding="async" />
                </button>
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
        );
      })}
      <script type="application/ld+json">{JSON.stringify(gallery).replace(/</g, '\\u003c')}</script>
    </>
  );
}

/** Shown below the last page that was read, and only when the API says there is an older one. */
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

/** The picture at full size in a dialog, with a way to the original file. */
function ImagePreview({ post, onClose }: { post: FanartPost | null; onClose: () => void }) {
  const { t } = useI18n();
  const { fanart } = t.supports;

  return (
    <Modal open={post !== null} onClose={onClose} label={post ? fanart.alt(post.username) : fanart.title} className={styles.preview}>
      {post && (
        <>
          <div className={styles.previewTop}>
            <span className={styles.username}>@{post.username}</span>
            <Button variant="secondary" size="sm" icon="close" onClick={onClose}>
              {fanart.close}
            </Button>
          </div>
          <LoadingImage className={styles.previewImage} src={post.mediaUrl} alt={fanart.alt(post.username)} decoding="async" />
          <div className={styles.previewBottom}>
            <ButtonLink variant="secondary" size="sm" icon="globe" href={post.mediaUrl} data-no-leave-prompt>
              {fanart.openOriginal}
            </ButtonLink>
          </div>
        </>
      )}
    </Modal>
  );
}

/** Page 1 loads with the section, every older page when "Load more" is pressed: the page that is already on screen stays put while the next one arrives. */
function Feed() {
  const { t } = useI18n();
  const [pages, setPages] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [loadingMore, startTransition] = useTransition();
  const [preview, setPreview] = useState<FanartPost | null>(null);
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
            <FanartPage page={index + 1} onPreview={setPreview} />
          </AsyncBoundary>
        ))}
      </ul>
      <ImagePreview post={preview} onClose={() => setPreview(null)} />
      <AsyncBoundary key={pages} resetKey={attempt} fallback={null} failure={() => null}>
        <LoadMore page={pages} busy={loadingMore} onMore={() => startTransition(() => setPages((current) => current + 1))} />
      </AsyncBoundary>
    </>
  );
}

export function Fanart() {
  const { t } = useI18n();
  const { fanart } = t.supports;

  return (
    <section id="fanart" className={styles.section} aria-labelledby="fanart-title">
      <PopField contained shapes={BLOOMS} colors={BLOOM_COLORS} count={BLOOM_COUNT} />

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
