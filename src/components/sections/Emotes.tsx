import { useState, type CSSProperties } from 'react';
import { useSound } from '../../context/sound.ts';
import { useToast } from '../../context/toast.ts';
import { emotes, type Emote } from '../../data/emotes.ts';
import { emotePng } from '../../lib/assets.ts';
import { copyText } from '../../lib/clipboard.ts';
import { downloadBlob } from '../../lib/download.ts';
import { Button } from '../ui/Button.tsx';
import { Icon } from '../ui/Icon.tsx';
import { Reveal } from '../ui/Reveal.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';
import styles from './Emotes.module.css';

const TILE_TONES = ['#ffffff', '#fff1a8', '#e7deff', '#d4f7f4'] as const;

export function Emotes() {
  const toast = useToast();
  const sound = useSound();
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState(0);

  const exportOne = async (emote: Emote): Promise<void> => {
    const response = await fetch(emotePng(emote.name));
    if (!response.ok) throw new Error(`Missing artwork for ${emote.name}.`);
    const blob = await response.blob();
    if (blob.type !== 'image/png') throw new Error(`Unexpected file type for ${emote.name}.`);
    downloadBlob(blob, `${emote.name}.png`);
  };

  const download = async (emote: Emote) => {
    setBusy(emote.name);
    try {
      await exportOne(emote);
      sound.play('pop');
      toast.notify(`${emote.name}.png saved.`);
    } catch {
      toast.notify('That download did not work. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const downloadAll = async () => {
    setBusy('all');
    setSaved(0);
    try {
      for (const emote of emotes) {
        await exportOne(emote);
        setSaved((count) => count + 1);
        await new Promise((resolve) => window.setTimeout(resolve, 180));
      }
      sound.play('gold');
      toast.notify('Emote pack saved.');
    } catch {
      toast.notify('The pack could not be saved. Please try again.');
    } finally {
      setBusy(null);
      setSaved(0);
    }
  };

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
          Free to use in chat, Discord and fan projects. Save any of them as a transparent PNG.
        </SectionHeading>

        <Reveal variant="drop" className={styles.packAction}>
          <Button variant="sun" icon="download" onClick={downloadAll} disabled={busy !== null}>
            {busy === 'all' ? `Saving ${saved} of ${emotes.length}` : `Save all ${emotes.length} emotes`}
          </Button>
        </Reveal>

        <ul className={styles.grid}>
          {emotes.map((emote, index) => (
            <li key={emote.name}>
              <Reveal variant="pop" delay={(index % 4) * 90} className={styles.reveal}>
                <article className={styles.card} style={{ '--tile': TILE_TONES[index % TILE_TONES.length] } as CSSProperties}>
                  <div className={styles.tile}>
                    <img
                      className={styles.face}
                      src={emotePng(emote.name)}
                      alt={`${emote.label} emote`}
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
                    <button type="button" className={styles.code} onClick={() => copy(emote)} aria-label={`Copy the code for ${emote.label}`}>
                      <Icon name="copy" size={16} />
                      <code>:{emote.name}:</code>
                    </button>
                    <button
                      type="button"
                      className={styles.save}
                      onClick={() => download(emote)}
                      disabled={busy !== null}
                      aria-label={`Download ${emote.label} as a PNG`}
                    >
                      <Icon name="download" size={18} />
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
