import { site } from '../../config/site.ts';
import { Icon } from '../ui/Icon.tsx';
import { platformIcon } from '../ui/platformIcon.ts';
import styles from './Footer.module.css';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <p className={styles.name}>{site.name}</p>
          <p className={styles.signoff}>Oshi kamu pokoknya harus aku! ya?</p>
        </div>

        <nav aria-label="Social links">
          <ul className={styles.socials}>
            {site.platforms.map((platform) => (
              <li key={platform.id}>
                <a
                  className={styles.social}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${platform.label}, ${platform.handle} (opens in a new tab)`}
                >
                  <Icon name={platformIcon[platform.id]} size={22} />
                  <span>{platform.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <ul className={styles.tags} aria-label="Hashtags">
          {site.hashtags.map((hashtag) => (
            <li key={hashtag.tag} title={hashtag.purpose}>
              {hashtag.tag}
            </li>
          ))}
        </ul>

        <a className={styles.top} href="#top">
          <Icon name="arrow-up" size={18} />
          <span>Back to top</span>
        </a>
      </div>

      <p className={styles.legal}>
        &copy; {year} Fikk@MizuHamzazu. Fan art and clips are welcome, please credit and link back.
      </p>
    </footer>
  );
}
