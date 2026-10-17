import { useCallback, useEffect, useId, useRef, useState, type RefObject } from 'react';
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

const navIds = ['lore', 'schedule', 'emotes', 'join', 'faq'] as const;
// The sections that live under the About menu. The others stay in the bar.
const aboutMenuIds = ['lore', 'schedule', 'emotes', 'faq'] as const;

interface NavProps {
  isHome: boolean;
  homePath: string;
  activeId: string;
  onNavigate: () => void;
}

/** From another page a section link goes back to the home page first. */
const sectionTo = (isHome: boolean, homePath: string, id: string): string => (isHome ? `#${id}` : `${homePath}#${id}`);

/** Closes a popup when something outside it is pressed or Escape is hit; Escape also gives the focus back to its button. */
function useDismiss(open: boolean, close: () => void, root: RefObject<HTMLElement | null>, button: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      close();
      button.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, close, root, button]);
}

/** "About" opens a list of the sections of the home page that tell about Mizu. The same markup serves the desktop bar and the mobile bubble. */
function AboutMenu({ isHome, homePath, activeId, onNavigate }: NavProps) {
  const { t } = useI18n();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLLIElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useDismiss(open, close, root, button);

  return (
    <li ref={root} className={styles.group}>
      <button
        ref={button}
        type="button"
        className={`${styles.link} ${styles.trigger}`}
        aria-expanded={open}
        aria-controls={menuId}
        aria-current={isHome && aboutMenuIds.some((id) => id === activeId) ? 'true' : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        {t.nav.about}
        <Icon name="chevron-down" size={16} className={styles.chevron} />
      </button>
      <ul id={menuId} className={styles.submenu} hidden={!open}>
        {aboutMenuIds.map((id) => (
          <li key={id}>
            <Link
              to={sectionTo(isHome, homePath, id)}
              className={styles.link}
              aria-current={isHome && activeId === id ? 'true' : undefined}
              onClick={() => {
                close();
                onNavigate();
              }}
            >
              {t.nav[id]}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

export function Header() {
  const { t, locale } = useI18n();
  const page = usePage();
  const isHome = page === 'home';
  const homePath = pagePath(locale, 'home');
  const sound = useSound();
  const bubbleId = useId();
  const [activeId, setActiveId] = useState('');
  const [open, setOpen] = useState(false);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuRoot = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const brandRoot = useRef<HTMLDivElement>(null);
  const brandButton = useRef<HTMLButtonElement>(null);

  const closeBubble = useCallback(() => setBubbleOpen(false), []);
  const closeMenu = useCallback(() => setOpen(false), []);

  useDismiss(bubbleOpen, closeBubble, brandRoot, brandButton);
  useDismiss(open, closeMenu, menuRoot, menuButton);

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

    const handleResize = () => {
      if (window.matchMedia('(min-width: 1024px)').matches) setOpen(false);
    };

    window.addEventListener('resize', handleResize);
    panel.current?.querySelector<HTMLElement>('nav a, nav button')?.focus();

    return () => window.removeEventListener('resize', handleResize);
  }, [open]);

  // The same links fill the desktop bar and the mobile bubble.
  const links = (
    <>
      <AboutMenu isHome={isHome} homePath={homePath} activeId={activeId} onNavigate={closeMenu} />
      <li>
        <Link to={sectionTo(isHome, homePath, 'join')} className={styles.link} aria-current={isHome && activeId === 'join' ? 'true' : undefined} onClick={closeMenu}>
          {t.nav.join}
        </Link>
      </li>
      <li>
        <Link to={pagePath(locale, 'content')} className={styles.link} aria-current={page === 'content' ? 'page' : undefined} onClick={closeMenu}>
          {t.nav.content}
        </Link>
      </li>
      <li>
        <Link to={pagePath(locale, 'collab')} className={styles.link} aria-current={page === 'collab' ? 'page' : undefined} onClick={closeMenu}>
          {t.nav.collab}
        </Link>
      </li>
      <li>
        <Link to={pagePath(locale, 'supports')} className={styles.link} aria-current={page === 'supports' ? 'page' : undefined} onClick={closeMenu}>
          {t.nav.supports}
        </Link>
      </li>
    </>
  );

  return (
    <header className={styles.header} data-scrolled={scrolled}>
      <div className={`container ${styles.bar}`}>
        <div ref={brandRoot} className={styles.brandWrap}>
          <button
            ref={brandButton}
            type="button"
            className={styles.brand}
            aria-expanded={bubbleOpen}
            aria-controls={bubbleId}
            aria-label={t.header.brandMenuLabel(site.name)}
            onClick={() => setBubbleOpen((current) => !current)}
          >
            <Paw className={styles.brandDrop} />
            <span>{site.nickname}</span>
          </button>

          <div id={bubbleId} className={styles.bubble} hidden={!bubbleOpen}>
            <Link to={isHome ? '#top' : homePath} className={styles.bubbleItem} onClick={closeBubble}>
              <Icon name="home" size={20} />
              <span>{t.nav.home}</span>
            </Link>
            <button type="button" className={styles.bubbleItem} data-on={sound.enabled} aria-pressed={sound.enabled} onClick={sound.toggle}>
              <Icon name={sound.enabled ? 'sound-on' : 'sound-off'} size={20} />
              <span>{sound.enabled ? t.header.soundOn : t.header.soundOff}</span>
            </button>
            <button type="button" className={styles.bubbleItem} disabled>
              <Icon name="bell" size={20} />
              <span>{t.header.comingSoon}</span>
            </button>
            <Link to={pagePath(locale, 'game')} className={styles.bubbleItem} aria-current={page === 'game' ? 'page' : undefined} onClick={closeBubble}>
              <Icon name="card" size={20} />
              <span>{t.header.bondingCard}</span>
            </Link>
          </div>
        </div>

        <nav className={styles.desktopNav} aria-label={t.header.primaryNav}>
          <ul className={styles.list}>{links}</ul>
        </nav>

        <div className={styles.actions}>
          <div className={styles.desktopLanguage}>
            <LanguageSelect />
          </div>
          <div ref={menuRoot} className={styles.menuWrap}>
            <button
              ref={menuButton}
              type="button"
              className={styles.iconButton}
              onClick={() => setOpen((current) => !current)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t.header.closeMenu : t.header.openMenu}
            >
              <Icon name={open ? 'close' : 'menu'} size={22} />
            </button>

            <div ref={panel} id="mobile-menu" className={styles.mobilePanel} hidden={!open}>
              <div className={styles.mobileLanguage}>
                <LanguageSelect />
              </div>
              <nav aria-label={t.header.mobileNav}>
                <ul className={styles.mobileList}>{links}</ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
