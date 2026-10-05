import { useEffect, useRef, useState } from 'react';
import { useSound } from '../../context/sound.ts';
import { site } from '../../config/site.ts';
import { navIds } from '../../data/content.ts';
import { useScrollSpy } from '../../hooks/useScrollSpy.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { Icon } from '../ui/Icon.tsx';
import { Paw } from '../ui/Doodles.tsx';
import { LanguageSelect } from './LanguageSelect.tsx';
import styles from './Header.module.css';

export function Header() {
  const { t } = useI18n();
  const activeId = useScrollSpy(navIds);
  const sound = useSound();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    const onResize = () => {
      if (window.matchMedia('(min-width: 900px)').matches) setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    panel.current?.querySelector<HTMLElement>('a')?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const links = navIds.map((id) => (
    <li key={id}>
      <a href={`#${id}`} className={styles.link} aria-current={activeId === id ? 'true' : undefined} onClick={() => setOpen(false)}>
        {t.nav[id]}
      </a>
    </li>
  ));

  return (
    <header className={styles.header} data-scrolled={scrolled}>
      <div className={`container ${styles.bar}`}>
        <a href="#top" className={styles.brand} aria-label={t.header.brandLabel(site.name)}>
          <Paw className={styles.brandDrop} />
          <span>{site.nickname}</span>
        </a>

        <nav className={styles.desktopNav} aria-label={t.header.primaryNav}>
          <ul className={styles.list}>{links}</ul>
        </nav>

        <div className={styles.actions}>
          <div className={styles.desktopLanguage}>
            <LanguageSelect />
          </div>
          <button
            type="button"
            className={styles.iconButton}
            onClick={sound.toggle}
            aria-pressed={sound.enabled}
            aria-label={sound.enabled ? t.header.soundOff : t.header.soundOn}
          >
            <Icon name={sound.enabled ? 'sound-on' : 'sound-off'} size={22} />
          </button>
          <button
            ref={menuButton}
            type="button"
            className={`${styles.iconButton} ${styles.menuButton}`}
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.header.closeMenu : t.header.openMenu}
          >
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      <div ref={panel} id="mobile-menu" className={styles.mobilePanel} hidden={!open}>
        <div className={styles.mobileLanguage}>
          <LanguageSelect />
        </div>
        <nav aria-label={t.header.mobileNav}>
          <ul className={styles.mobileList}>{links}</ul>
        </nav>
      </div>
    </header>
  );
}
