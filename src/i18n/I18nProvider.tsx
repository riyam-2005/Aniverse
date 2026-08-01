"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./config";
import en from "./messages/en.json";
import bn from "./messages/bn.json";
import hi from "./messages/hi.json";

type Messages = typeof en;

const MESSAGES: Record<Locale, Messages> = { en, bn, hi };
const STORAGE_KEY = "aniverse-locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  // Start on the default locale server-side to avoid a hydration
  // mismatch, then pick up the saved preference once mounted client-side —
  // same pattern as ThemeToggle.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LOCALES.includes(saved as Locale)) {
      setLocaleState(saved as Locale);
    }
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing / storage disabled — locale still applies for
      // this session via React state, it just won't persist.
    }
  }

  const value = useMemo(() => ({ locale, setLocale }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Dot-path lookup, e.g. t("nav.trending"). Falls back to the key itself
 *  if it isn't found, so a missing translation never renders blank. */
function resolve(messages: Messages, path: string): string | undefined {
  return path
    .split(".")
    .reduce<unknown>((acc, part) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined), messages) as
    | string
    | undefined;
}

export function useTranslations() {
  const { locale, setLocale } = useContext(I18nContext);
  const messages = MESSAGES[locale];

  function t(path: string): string {
    return resolve(messages, path) ?? resolve(MESSAGES[DEFAULT_LOCALE], path) ?? path;
  }

  return { t, locale, setLocale };
}
