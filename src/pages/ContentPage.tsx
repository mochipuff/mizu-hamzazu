import { useOptimistic, useState, useTransition } from 'react';
import { AsyncBoundary } from '../components/ui/AsyncBoundary.tsx';
import { Button } from '../components/ui/Button.tsx';
import { ImagePlaceholder, LoadingImage, SkeletonLines } from '../components/ui/LoadingImage.tsx';
import { Notice } from '../components/ui/Notice.tsx';
import { SectionHeading } from '../components/ui/SectionHeading.tsx';
import { WaveDivider } from '../components/ui/WaveDivider.tsx';
import { preload, useData } from '../data/api.ts';
import { useI18n } from '../i18n/i18n.ts';
import { localeInfo } from '../i18n/locales.ts';
import styles from './ContentPage.module.css';

const TABS = ['live', 'short', 'vod', 'song'] as const;

type Tab = (typeof TABS)[number];
type Kind = Exclude<Tab, 'song'>;

interface Video {
  id: string;
  kind: Kind;
  label: 'original' | 'cover' | null;
  title: string;
  publishedAt: string;
}

const SKELETON_COUNT = 12;

const contentPath = (tab: Tab): string => `/api/content/${tab}/`;

const videoUrl = (kind: Kind, id: string): string => (kind === 'short' ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`);

function VideoSkeleton({ tab }: { tab: Tab }) {
  const { t } = useI18n();

  return (
    <ul className={styles.grid} data-kind={tab} aria-busy="true" aria-label={t.common.loading}>
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <li key={index}>
          <div className={`${styles.card} ${styles.pending}`} aria-hidden="true">
            <span className={styles.thumb}>
              <ImagePlaceholder />
            </span>
            <SkeletonLines />
          </div>
        </li>
      ))}
    </ul>
  );
}

function VideoList({ tab }: { tab: Tab }) {
  const { t, locale } = useI18n();
  const videos = useData<Video[]>(contentPath(tab));

  if (videos.length === 0) return <Notice kind="empty">{t.common.empty}</Notice>;

  const formatDate = new Intl.DateTimeFormat(localeInfo[locale].htmlLang, { dateStyle: 'medium' }).format;

  return (
    <ul className={styles.grid} data-kind={tab} aria-label={t.content.kinds[tab]}>
      {videos.map(({ id, kind, label, title, publishedAt }) => {
        const tag = label ?? kind;
        return (
          <li key={id}>
            <a className={styles.card} href={videoUrl(kind, id)} target="_blank" rel="noopener noreferrer">
              <LoadingImage className={styles.thumb} src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" />
              <span className={styles.title}>{title}</span>
              <span className={styles.meta}>
                <span className={styles.tag} data-tag={tag}>
                  {t.content.tags[tag]}
                </span>
                <time className={styles.date} dateTime={publishedAt}>
                  {formatDate(new Date(publishedAt))}
                </time>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function ContentPage() {
  const { t } = useI18n();
  const { content } = t;
  const [tab, setTab] = useState<Tab>('live');
  const [selected, setSelected] = useOptimistic(tab);
  const [switching, startTransition] = useTransition();

  const select = (id: Tab) =>
    startTransition(() => {
      setSelected(id);
      setTab(id);
    });

  return (
    <>
      <main id="main">
        <section className={styles.section} aria-labelledby="content-title">
          <div className="container">
            <SectionHeading headingId="content-title" title={content.title} as="h1">
              {content.lead}
            </SectionHeading>

            <div className={styles.tabs} role="group" aria-label={content.tabsLabel}>
              {TABS.map((id) => (
                <Button
                  key={id}
                  variant={id === selected ? 'sun' : 'secondary'}
                  size="sm"
                  aria-pressed={id === selected}
                  onPointerEnter={() => preload(contentPath(id))}
                  onFocus={() => preload(contentPath(id))}
                  onClick={() => select(id)}
                >
                  {content.kinds[id]}
                </Button>
              ))}
            </div>

            <div aria-busy={switching}>
              <AsyncBoundary resetKey={tab} fallback={<VideoSkeleton tab={tab} />}>
                <VideoList key={tab} tab={tab} />
              </AsyncBoundary>
            </div>
          </div>
        </section>
      </main>
      <WaveDivider color="var(--ink)" />
    </>
  );
}
