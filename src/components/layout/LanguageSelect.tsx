import type { ChangeEvent } from 'react';
import { useI18n } from '../../i18n/i18n.ts';
import { isLocale, LOCALES, localeInfo } from '../../i18n/locales.ts';
import { Icon } from '../ui/Icon.tsx';
import styles from './LanguageSelect.module.css';

export function LanguageSelect() {
  const { locale, setLocale, t } = useI18n();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    if (isLocale(value)) setLocale(value);
  };

  return (
    <div className={styles.field}>
      <Icon name="globe" size={20} className={styles.icon} />
      <select className={styles.select} value={locale} onChange={handleChange} aria-label={t.header.language}>
        {LOCALES.map((code) => (
          <option key={code} value={code} lang={localeInfo[code].htmlLang}>
            {localeInfo[code].label}
          </option>
        ))}
      </select>
    </div>
  );
}
