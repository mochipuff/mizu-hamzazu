import { useApi } from '../../data/api.ts';
import { formatAmount, platformLabel, type Donation } from '../../data/supports.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { localeInfo } from '../../i18n/locales.ts';
import { Paper } from '../ui/Paper.tsx';
import { Reveal } from '../ui/Reveal.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';
import { Bow, Burst, Crown, Heart } from '../ui/Stickers.tsx';
import styles from './TopDonations.module.css';

const PODIUM_SIZE = 3;

const initialOf = (name: string): string => Array.from(name)[0]?.toUpperCase() ?? '';

/** The sticker on each podium photo: a crown for first place, a bow for second, a heart for third. */
const podiumSticker = [Crown, Bow, Heart] as const;

export function TopDonations() {
  const { t, locale } = useI18n();
  const { donations } = t.supports;
  const language = localeInfo[locale].htmlLang;
  const { status, data: top = [] } = useApi<Donation[]>('/api/donations/');

  const renderPodium = (donation: Donation, index: number) => {
    const rank = index + 1;
    const Sticker = podiumSticker[index] ?? Heart;

    return (
      <li key={donation.name} className={styles.podium} data-rank={rank}>
        <Reveal variant="pop" delay={index * 90} className={styles.card}>
          <span className={styles.badge}>
            <Burst className={styles.burst} />
            <span aria-hidden="true">{rank}</span>
            <span className={styles.srOnly}>{donations.rank(rank)}</span>
          </span>
          <div className={styles.photo}>
            <span className={styles.initial} aria-hidden="true">
              {initialOf(donation.name)}
            </span>
            <Sticker className={styles.photoSticker} />
          </div>
          <p className={styles.name}>{donation.name}</p>
          <p className={styles.amount}>{formatAmount(donation.amount, language)}</p>
          <p className={styles.via}>{donations.via(platformLabel(donation.platform))}</p>
        </Reveal>
      </li>
    );
  };

  const renderRow = (donation: Donation, rank: number) => (
    <li key={donation.name} className={styles.row}>
      <span className={styles.rowRank}>
        <span aria-hidden="true">{rank}</span>
        <span className={styles.srOnly}>{donations.rank(rank)}</span>
      </span>
      <span className={styles.rowWho}>
        <span className={styles.rowName}>{donation.name}</span>
        <span className={styles.rowVia}>{donations.via(platformLabel(donation.platform))}</span>
      </span>
      <span className={styles.rowAmount}>{formatAmount(donation.amount, language)}</span>
    </li>
  );

  return (
    <section id="donations" className={styles.section} aria-labelledby="donations-title">
      <div className="container">
        <SectionHeading headingId="donations-title" title={donations.title}>
          {donations.lead}
        </SectionHeading>

        <Paper tone="cream" pattern="ruled" torn tilt={-0.4} className={styles.notebook}>
          <span className={styles.bookmark} aria-hidden="true">
            <Heart className={styles.bookmarkHeart} />
          </span>
          <ol className={styles.list} aria-label={donations.listLabel}>
            {top.map((donation, index) => (index < PODIUM_SIZE ? renderPodium(donation, index) : renderRow(donation, index + 1)))}
          </ol>
          {status === 'error' && (
            <p className="load-error" role="alert">
              {t.common.loadFailed}
            </p>
          )}
        </Paper>
      </div>
    </section>
  );
}
