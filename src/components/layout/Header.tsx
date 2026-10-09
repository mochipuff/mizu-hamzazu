import { useEffect, useRef, useState } from 'react';
import { useSound } from '../../context/sound.ts';
import { site } from '../../config/site.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { usePage } from '../../i18n/navigation.ts';
import { pagePath } from '../../i18n/pages.ts';
import { Paw } from '../ui/Doodles.tsx';
import { Icon } from '../ui/Icon.tsx';
import { Link } from '../ui/Link.tsx';
import { LanguageSelect } from './LanguageSelect.tsx';
import styles from './Header.module.css';

const navIds = ['about', 'schedule', 'emotes', 'join', 'faq'] as const;

export function Header() {
  const { t, locale } = useI18n();
  const page = usePage();
  const isHome = page === 'home';
  const homePath = pagePath(locale, 'home');
  const sound = useSound();
  const [activeId, setActiveId] = useState('');
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Highlights the section being read. The sections only exist on the home page, so `page` re-attaches the observer when another page brings its own.
  useEffect(() => {
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        setActiveId(navIds.find((id) => visible.has(id)) ?? '');
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );

    for (const id of navIds) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [page]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      menuButton.current?.focus();
    };
    const handleResize = () => {
      if (window.matchMedia('(min-width: 1024px)').matches) setOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    panel.current?.querySelector<HTMLElement>('nav a')?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [open]);

  const handleCloseMenu = () => setOpen(false);

  // From another page a section link goes back to the home page first. The same links fill the desktop bar and the mobile panel.
  const sectionLinks = navIds.map((id) => (
    <li key={id}>
      <Link
        to={isHome ? `#${id}` : `${homePath}#${id}`}
        className={styles.link}
        aria-current={isHome && activeId === id ? 'true' : undefined}
        onClick={handleCloseMenu}
      >
        {t.nav[id]}
      </Link>
    </li>
  ));
  const links = [
    ...sectionLinks,
    <li key="supports">
      <Link to={pagePath(locale, 'supports')} className={styles.link} aria-current={page === 'supports' ? 'page' : undefined} onClick={handleCloseMenu}>
        {t.nav.supports}
      </Link>
    </li>,
  ];

  return (
    <header className={styles.header} data-scrolled={scrolled}>
      <div className={`container ${styles.bar}`}>
        <Link
          to={isHome ? '#top' : homePath}
          className={styles.brand}
          aria-label={isHome ? t.header.brandLabel(site.name) : t.header.brandHomeLabel(site.name)}
        >
          <Paw className={styles.brandDrop} />
          <span>{site.nickname}</span>
        </Link>

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
