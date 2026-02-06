import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, Language } from './translations';

type TranslationsType = typeof translations[Language];

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationsType;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'heroes-marked-language';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'pt-BR' || stored === 'en') {
        return stored;
      }
      // Detect browser language
      const browserLang = navigator.language;
      if (browserLang.startsWith('pt')) {
        return 'pt-BR';
      }
    }
    return 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value: I18nContextType = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);

  // Fallback to prevent blank-screen crashes if provider wiring breaks during HMR.
  if (context === null) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('useI18n must be used within an I18nProvider');
    }

    return {
      language: 'en',
      setLanguage: () => {
        // no-op
      },
      t: translations.en,
    } as I18nContextType;
  }

  return context;
}

export function useTranslation() {
  const { t } = useI18n();
  return t;
}
