import type { CSSProperties } from 'react';
import { useSound } from '../../context/sound.ts';
import { useToast } from '../../context/toast.ts';
import { emoteNames, type EmoteName } from '../../data/emotes.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { emoteUrl } from '../../lib/assets.ts';
import { copyText } from '../../lib/clipboard.ts';
import { Garland } from '../ui/Garland.tsx';
import { Icon } from '../ui/Icon.tsx';
import { Reveal } from '../ui/Reveal.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';
import styles from './Emotes.module.css';

const TILE_TONES = ['#ffffff', '#fff1a8', '#e7deff', '#d4f7f4'] as const;

export function Emotes() {
  const toast = useToast();
  const sound = useSound();
  const { t } = useI18n();

  const copy = async (name: EmoteName) => {
    const code = `:${name}:`;
    const ok = await copyText(code);
    if (ok) sound.play('copy');
    toast.notify(ok ? t.emotes.copied(code) : t.common.copyBlocked);
  };

  return (
    <section id="emotes" className={styles.section} aria-labelledby="emotes-title">
      <div className="container">
        <SectionHeading headingId="emotes-title" title={t.emotes.title}>
          {t.emotes.lead}
        </SectionHeading>

        <ul className={styles.grid}>
          {emoteNames.map((name, index) => {
            const emote = t.emotes.items[name];
            return (
              <li key={name}>
                <Reveal variant="pop" delay={(index % 4) * 90} className={styles.reveal}>
                  <article className={styles.card} style={{ '--tile': TILE_TONES[index % TILE_TONES.length] } as CSSProperties}>
                    <Garland corner={index % 2 === 0 ? 'top-right' : 'top-left'} />
                    <div className={styles.tile}>
                      <img
                        className={styles.face}
                        src={emoteUrl(name)}
                        alt={t.emotes.imageAlt(name, emote.usage)}
                        width={512}
                        height={512}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    </div>
                    <h3 className={styles.name}>{emote.label}</h3>
                    <p className={styles.usage}>{emote.usage}</p>
                    <div className={styles.actions}>
                      <button type="button" className={styles.code} onClick={() => copy(name)} aria-label={t.emotes.copyLabel(emote.label)}>
                        <Icon name="copy" size={16} />
                        <code>:{name}:</code>
                      </button>
                    </div>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
