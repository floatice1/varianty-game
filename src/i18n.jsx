import { createContext, useContext, useMemo } from 'react';
import en from './locales/en';
import uk from './locales/uk';
import pl from './locales/pl';

const LOCALES = { en, uk, pl };
export const I18nContext = createContext(() => '');

export function I18nProvider({ lang, children }) {
  const t = useMemo(() => (key, params) => {
    const locale = LOCALES[lang] || LOCALES.en;
    let str = locale[key] ?? LOCALES.en[key] ?? key;
    if (params) Object.entries(params).forEach(([k, v]) => { str = str.replace(`{${k}}`, String(v)); });
    return str;
  }, [lang]);
  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
}

export const useT = () => useContext(I18nContext);
