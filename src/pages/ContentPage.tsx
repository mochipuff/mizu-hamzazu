import { useState } from 'react';
import { Button } from '../components/ui/Button.tsx';
import { SectionHeading } from '../components/ui/SectionHeading.tsx';
import { WaveDivider } from '../components/ui/WaveDivider.tsx';
import { useApi } from '../data/api.ts';
import { useI18n } from '../i18n/i18n.ts';
import { localeInfo } from '../i18n/locales.ts';
import styles from './ContentPage.module.css';

const KINDS = ['live', 'short', 'vod'] as const;

type Kind = (typeof KINDS)[number];

interface Video {
  id: string;
  title: string;
  publishedAt: string;
}

const videoUrl = (kind: Kind, id: string): string => (kind === 'short' ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`);

function VideoList({ kind }: { kind: Kind }) {
  const { t, locale } = useI18n();
  const videos = useApi<Video[]>(`/api/content/${kind}/`);

  if (videos.status === 'error') {
    return (
      <p className="load-error" role="alert">
        {t.common.loadFailed}
      </p>
    );
  }
  if (videos.status !== 'ready') return null;
  if (videos.data.length === 0) return <p className="load-error">{t.content.empty}</p>;

  const formatDate = new Intl.DateTimeFormat(localeInfo[locale].htmlLang, { dateStyle: 'medium' }).format;

  return (
    <ul className={styles.grid} data-kind={kind} aria-label={t.content.kinds[kind]}>
      {videos.data.map(({ id, title, publishedAt }) => (
        <li key={id}>
          <a className={styles.card} href={videoUrl(kind, id)} target="_blank" rel="noopener noreferrer">
            <img className={styles.thumb} src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" />
            <span className={styles.title}>{title}</span>
            <time className={styles.date} dateTime={publishedAt}>
              {formatDate(new Date(publishedAt))}
            </time>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function ContentPage() {
  const { t } = useI18n();
  const { content } = t;
  const [kind, setKind] = useState<Kind>('live');

  return (
    <>
      <main id="main">
        <section className={styles.section} aria-labelledby="content-title">
          <div className="container">
            <SectionHeading headingId="content-title" title={content.title} as="h1">
              {content.lead}
            </SectionHeading>

            <div className={styles.tabs} role="group" aria-label={content.tabsLabel}>
              {KINDS.map((id) => (
                <Button key={id} variant={id === kind ? 'sun' : 'secondary'} size="sm" aria-pressed={id === kind} onClick={() => setKind(id)}>
                  {content.kinds[id]}
                </Button>
              ))}
            </div>

            <VideoList key={kind} kind={kind} />
          </div>
        </section>
      </main>
      <WaveDivider color="var(--ink)" />
    </>
  );
}
