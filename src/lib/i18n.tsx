'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Locale } from './types';
import esMessages from '@/messages/es.json';
import enMessages from '@/messages/en.json';

type Messages = typeof esMessages;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'es',
  setLocale: () => { },
  t: esMessages,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');

  useEffect(() => {
    // Check saved preference or browser language
    try {
      const saved = localStorage.getItem('lumohq_locale') as Locale | null;
      if (saved && (saved === 'es' || saved === 'en')) {
        setLocaleState(saved);
        return;
      }
      const navLang = navigator.language?.toLowerCase() || '';
      if (navLang.startsWith('en')) {
        setLocaleState('en');
      } else {
        setLocaleState('es');
      }
    } catch {
      // fallback
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('lumohq_locale', newLocale);
      document.cookie = `lumohq_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLocale;
    } catch {
      // ignore in SSR
    }
  };

  const t = locale === 'en' ? enMessages : esMessages;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

