"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "vi" | "en";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const STORAGE_KEY = "pino-locale";
const LocaleContext = createContext<LocaleContextValue>({ locale: "vi", setLocale: () => undefined });

function resolveInitialLocale(): Locale {
  if (typeof window === "undefined") return "vi";
  const query = new URLSearchParams(window.location.search).get("lang");
  if (query === "en" || query === "vi") return query;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "vi") return stored;
  return navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");

  useEffect(() => { setLocaleState(resolveInitialLocale()); }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    const url = new URL(window.location.href);
    url.searchParams.delete("lang");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() { return useContext(LocaleContext); }
export function useLocalized<T>(vi: T, en: T): T { return useLocale().locale === "vi" ? vi : en; }

export function Localized({ vi, en }: { vi: ReactNode; en: ReactNode }) {
  const { locale } = useLocale();
  return <>{locale === "vi" ? vi : en}</>;
}

export function LocaleToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  return (
    <div className={`locale-toggle ${className}`.trim()} role="group" aria-label={locale === "vi" ? "Chọn ngôn ngữ" : "Choose language"}>
      <button type="button" className={locale === "vi" ? "is-active" : ""} onClick={() => setLocale("vi")} aria-pressed={locale === "vi"}>VN</button>
      <span aria-hidden="true">/</span>
      <button type="button" className={locale === "en" ? "is-active" : ""} onClick={() => setLocale("en")} aria-pressed={locale === "en"}>EN</button>
    </div>
  );
}
