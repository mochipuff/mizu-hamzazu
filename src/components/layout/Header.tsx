import { useEffect, useRef, useState } from 'react';
import { useSound } from '../../context/sound.ts';
import { navItems } from '../../data/content.ts';
import { site } from '../../config/site.ts';
import { useScrollSpy } from '../../hooks/useScrollSpy.ts';
import { Icon } from '../ui/Icon.tsx';
import { Paw } from '../ui/Doodles.tsx';
import styles from './Header.module.css';

const sectionIds = navItems.map((item) => item.id);

export function Header() {
  const activeId = useScrollSpy(sectionIds);
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

  const links = navItems.map((item) => (
    <li key={item.id}>
      <a
        href={`#${item.id}`}
        className={styles.link}
        aria-current={activeId === item.id ? 'true' : undefined}
        onClick={() => setOpen(false)}
      >
        {item.label}
      </a>
    </li>
  ));

  return (
    <header className={styles.header} data-scrolled={scrolled}>
      <div className={`container ${styles.bar}`}>
        <a href="#top" className={styles.brand} aria-label={`${site.name}, back to top`}>
          <Paw className={styles.brandDrop} />
          <span>{site.nickname}</span>
        </a>

        <nav className={styles.desktopNav} aria-label="Primary">
          <ul className={styles.list}>{links}</ul>
        </nav>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={sound.toggle}
            aria-pressed={sound.enabled}
            aria-label={sound.enabled ? 'Turn sound effects off' : 'Turn sound effects on'}
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
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      <div ref={panel} id="mobile-menu" className={styles.mobilePanel} data-open={open} hidden={!open}>
        <nav aria-label="Mobile">
          <ul className={styles.mobileList}>{links}</ul>
        </nav>
      </div>
    </header>
  );
}
