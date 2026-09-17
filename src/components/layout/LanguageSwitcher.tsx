"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LOCALE, LOCALES, LOCALE_LABELS } from "@/i18n/config";
import { useTranslations } from "@/i18n/I18nProvider";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useTranslations();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <select
      value={mounted ? locale : DEFAULT_LOCALE}
      onChange={(e) => setLocale(e.target.value as (typeof LOCALES)[number])}
      aria-label={t("common.language")}
      className={`input !w-auto cursor-pointer py-1.5 text-xs ${className}`}
    >
      {LOCALES.map((code) => (
        <option key={code} value={code}>
          {LOCALE_LABELS[code]}
        </option>
      ))}
    </select>
  );
}
