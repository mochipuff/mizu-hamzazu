import type { CSSProperties } from 'react';
import { useSound } from '../../context/sound.ts';
import { useToast } from '../../context/toast.ts';
import { emotes, type Emote } from '../../data/emotes.ts';
import { emotePng } from '../../lib/assets.ts';
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

  const copy = async (emote: Emote) => {
    const code = `:${emote.name}:`;
    const ok = await copyText(code);
    if (ok) sound.play('copy');
    toast.notify(ok ? `Copied ${code}` : 'Copy is blocked in this browser.');
  };

  return (
    <section id="emotes" className={styles.section} aria-labelledby="emotes-title">
      <div className="container">
        <SectionHeading headingId="emotes-title" title="Emote pack">
          Free to use in chat, Discord and fan projects. Tap a code to copy it.
        </SectionHeading>

        <ul className={styles.grid}>
          {emotes.map((emote, index) => (
            <li key={emote.name}>
              <Reveal variant="pop" delay={(index % 4) * 90} className={styles.reveal}>
                <article className={styles.card} style={{ '--tile': TILE_TONES[index % TILE_TONES.length] } as CSSProperties}>
                  <Garland corner={index % 2 === 0 ? 'top-right' : 'top-left'} />
                  <div className={styles.tile}>
                    <img
                      className={styles.face}
                      src={emotePng(emote.name)}
                      alt={`${emote.name} emote: ${emote.usage}`}
                      width={512}
                      height={512}
                      decoding="async"
                      draggable={false}
                    />
                  </div>
                  <h3 className={styles.name}>{emote.label}</h3>
                  <p className={styles.usage}>{emote.usage}</p>
                  <div className={styles.actions}>
                    <button type="button" className={styles.code} onClick={() => copy(emote)} aria-label={`Copy the code for ${emote.label}`}>
                      <Icon name="copy" size={16} />
                      <code>:{emote.name}:</code>
                    </button>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
