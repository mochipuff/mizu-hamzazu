import { site } from '../../config/site.ts';
import { useI18n } from '../../i18n/i18n.ts';
import { Icon } from '../ui/Icon.tsx';
import { platformIcon } from '../ui/platformIcon.ts';
import styles from './Footer.module.css';

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <p className={styles.name}>{site.name}</p>
          <p className={styles.signoff}>{t.footer.signoff}</p>
        </div>

        <nav aria-label={t.footer.socialNav}>
          <ul className={styles.socials}>
            {site.platforms.map((platform) => (
              <li key={platform.id}>
                <a
                  className={styles.social}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t.footer.openInNewTab(platform.label, platform.handle)}
                >
                  <Icon name={platformIcon[platform.id]} size={22} />
                  <span>{platform.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <ul className={styles.tags} aria-label={t.footer.hashtags}>
          {site.hashtags.map((hashtag) => (
            <li key={hashtag.tag} title={t.hashtags[hashtag.purpose]}>
              {hashtag.tag}
            </li>
          ))}
        </ul>

        <a className={styles.top} href="#top">
          <Icon name="arrow-up" size={18} />
          <span>{t.footer.backToTop}</span>
        </a>
      </div>

      <p className={styles.legal}>{t.footer.legal(year, site.copyrightOwner)}</p>
    </footer>
  );
}
