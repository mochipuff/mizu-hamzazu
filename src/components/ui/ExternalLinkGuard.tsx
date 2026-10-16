import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n/i18n.ts';
import { ButtonLink, Button } from './Button.tsx';
import { Icon } from './Icon.tsx';
import { Modal } from './Modal.tsx';
import styles from './ExternalLinkGuard.module.css';

const YOUTUBE_HOST = /(^|\.)(youtube\.com|youtu\.be)$/;

/** The address a plain left click is about to leave the site for, or `null` for anything else (modified clicks, same-site links, `mailto:`, downloads). */
function leavingFor(event: MouseEvent): URL | null {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;

  const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
  if (!anchor || anchor.hasAttribute('download') || anchor.hasAttribute('data-no-leave-prompt')) return null;

  const url = URL.canParse(anchor.href) ? new URL(anchor.href) : null;
  return url && (url.protocol === 'https:' || url.protocol === 'http:') && url.origin !== window.location.origin ? url : null;
}

/**
 * Asks before a click on any link to another site: one listener for the whole page, so a link added later is covered without a second edit.
 * Ctrl/Cmd/middle clicks go straight through, and with JavaScript off the links simply work. A link that must not ask carries `data-no-leave-prompt`.
 * The address shown is the one the browser will really open (`URL.host`, punycode for look-alike domains), not the text of the link.
 */
export function ExternalLinkGuard() {
  const { t } = useI18n();
  const [target, setTarget] = useState<URL | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const url = leavingFor(event);
      if (!url) return;
      event.preventDefault();
      setTarget(url);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const close = () => setTarget(null);
  const isYouTube = target !== null && YOUTUBE_HOST.test(target.hostname);
  const title = isYouTube ? t.leave.youtubeTitle : t.leave.title;

  return (
    <Modal open={target !== null} onClose={close} label={title} className={styles.panel}>
      {target && (
        <>
          <Icon name={isYouTube ? 'play' : 'globe'} size={32} />
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.body}>{t.leave.body(target.host)}</p>
          <p className={styles.url}>{target.href}</p>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={close}>
              {t.leave.cancel}
            </Button>
            <ButtonLink href={target.href} icon={isYouTube ? 'play' : 'globe'} onClick={close} data-no-leave-prompt>
              {t.leave.open}
            </ButtonLink>
          </div>
        </>
      )}
    </Modal>
  );
}
