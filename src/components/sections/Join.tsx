import { site } from '../../config/site.ts';
import { perks } from '../../data/content.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { ButtonLink } from '../ui/Button.tsx';
import { FloatingBadges } from '../ui/FloatingBadges.tsx';
import { Icon, type IconName } from '../ui/Icon.tsx';
import { Panel, type PanelTone } from '../ui/Panel.tsx';
import { platformIcon } from '../ui/platformIcon.ts';
import { Reveal } from '../ui/Reveal.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';
import styles from './Join.module.css';

const perkIcons: readonly IconName[] = ['star', 'lock', 'discord', 'calendar'];
const perkTones: readonly PanelTone[] = ['sun', 'lilac', 'mint', 'pink'];

export function Join() {
  const { t } = useI18n();

  return (
    <section id="join" className={styles.section} aria-labelledby="join-title">
      <div className="container">
        <SectionHeading headingId="join-title" title={t.join.title}>
          {t.join.lead}
        </SectionHeading>

        <ul className={styles.perks}>
          {perks.map((perk, index) => {
            const { title, description } = t.join.perks[perk.id];
            return (
              <li key={perk.id}>
                <Reveal variant={index % 2 === 0 ? 'swing' : 'pop'} delay={index * 90} className={styles.reveal}>
                  <Panel tone={perkTones[index % perkTones.length] ?? 'white'} shape={index % 2 === 0 ? 'leaf' : 'soft'} className={perk.tiers ? `${styles.perk} ${styles.hasBadges}` : styles.perk}>
                    {perk.tiers && <FloatingBadges tiers={perk.tiers} />}
                    <span className={styles.perkIcon}>
                      <Icon name={perkIcons[index % perkIcons.length] ?? 'star'} size={26} />
                    </span>
                    <h3 className={styles.perkTitle}>{title}</h3>
                    <p>{description}</p>
                  </Panel>
                </Reveal>
              </li>
            );
          })}
        </ul>

        <Reveal variant="drop" delay={120} className={styles.platformsWrap}>
          <h3 className={styles.platformsTitle}>{t.join.platformsTitle}</h3>
          <ul className={styles.platforms}>
            {site.platforms.map((platform) => {
              const { cta, blurb } = t.platforms[platform.id];
              return (
                <li key={platform.id}>
                  <Panel tone="white" shape="ticket" className={styles.platform}>
                    <div className={styles.platformText}>
                      <p className={styles.platformName}>{platform.label}</p>
                      <p className={styles.handle}>{platform.handle}</p>
                      <p className={styles.blurb}>{blurb}</p>
                    </div>
                    <ButtonLink
                      variant={platform.id === 'youtube' ? 'primary' : 'secondary'}
                      size="sm"
                      icon={platformIcon[platform.id]}
                      href={platform.url}
                      aria-label={t.join.platformCtaLabel(cta, platform.label)}
                    >
                      {cta}
                    </ButtonLink>
                  </Panel>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
