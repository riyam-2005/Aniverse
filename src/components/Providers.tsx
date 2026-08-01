"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { I18nProvider } from "@/i18n/I18nProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>{children}</I18nProvider>
    </SessionProvider>
  );
}
