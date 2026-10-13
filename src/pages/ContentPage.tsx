import { useState } from 'react';
import { Button } from '../components/ui/Button.tsx';
import { Notice } from '../components/ui/Notice.tsx';
import { SectionHeading } from '../components/ui/SectionHeading.tsx';
import { WaveDivider } from '../components/ui/WaveDivider.tsx';
import { useApi } from '../data/api.ts';
import { useI18n } from '../i18n/i18n.ts';
import { localeInfo } from '../i18n/locales.ts';
import styles from './ContentPage.module.css';

// `song` is not a kind of upload but a label on one: the API gathers every video labelled as a song here, whatever its kind.
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

const videoUrl = (kind: Kind, id: string): string => (kind === 'short' ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`);

function VideoList({ tab }: { tab: Tab }) {
  const { t, locale } = useI18n();
  const videos = useApi<Video[]>(`/api/content/${tab}/`);

  if (videos.status === 'error') return <Notice kind="error">{t.common.loadFailed}</Notice>;
  if (videos.status !== 'ready') return null;
  if (videos.data.length === 0) return <Notice kind="empty">{t.common.empty}</Notice>;

  const formatDate = new Intl.DateTimeFormat(localeInfo[locale].htmlLang, { dateStyle: 'medium' }).format;

  return (
    <ul className={styles.grid} data-kind={tab} aria-label={t.content.kinds[tab]}>
      {videos.data.map(({ id, kind, label, title, publishedAt }) => {
        const tag = label ?? kind;
        return (
          <li key={id}>
            <a className={styles.card} href={videoUrl(kind, id)} target="_blank" rel="noopener noreferrer">
              <img className={styles.thumb} src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" />
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
                <Button key={id} variant={id === tab ? 'sun' : 'secondary'} size="sm" aria-pressed={id === tab} onClick={() => setTab(id)}>
                  {content.kinds[id]}
                </Button>
              ))}
            </div>

            <VideoList key={tab} tab={tab} />
          </div>
        </section>
      </main>
      <WaveDivider color="var(--ink)" />
    </>
  );
}
