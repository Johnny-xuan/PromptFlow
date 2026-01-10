import { createContext, useContext, ReactNode } from 'react';
import { Language, Translations, getTranslations } from './index';

interface I18nContextValue {
  lang: Language;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  language: Language;
  children: ReactNode;
}

export function I18nProvider({ language, children }: I18nProviderProps) {
  const value: I18nContextValue = {
    lang: language,
    t: getTranslations(language),
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    // 默认返回中文
    return {
      lang: 'zh-CN',
      t: getTranslations('zh-CN'),
    };
  }
  return context;
}
