import { useI18n } from '../../i18n/i18n.ts';
import { isLocale, LOCALES, localeInfo } from '../../i18n/locales.ts';
import { Dropdown, type DropdownOption } from '../ui/Dropdown.tsx';

const options: DropdownOption[] = LOCALES.map((code) => ({ value: code, label: localeInfo[code].label, lang: localeInfo[code].htmlLang }));

export function LanguageSelect() {
  const { locale, setLocale, t } = useI18n();

  const handleChange = (value: string) => {
    if (isLocale(value)) setLocale(value);
  };

  return <Dropdown value={locale} options={options} onChange={handleChange} label={t.header.language} icon="globe" align="end" />;
}
