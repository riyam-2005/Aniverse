"use client";

import { useEffect, useState } from "react";

interface LocalBroadcastTimeProps {
  time?: string | null;
  day?: string | null;
  className?: string;
}

/**
 * Converts Japan Standard Time (JST / UTC+9) broadcast schedules
 * to the user's localized device timezone.
 *
 * Safe against hydration mismatch by rendering the canonical JST time
 * on server/SSR and hydrating to localized time on client.
 */
export default function LocalBroadcastTime({
  time,
  day,
  className = "",
}: LocalBroadcastTimeProps) {
  const [mounted, setMounted] = useState(false);
  const [localFormatted, setLocalFormatted] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!time) return;

    try {
      // JST is UTC+09:00. Normalize time format "HH:mm" or "H:mm"
      const match = time.match(/(\d{1,2}):(\d{2})/);
      if (!match) return;

      const hours = match[1].padStart(2, "0");
      const minutes = match[2];

      // Anchor to arbitrary UTC date with +09:00 offset
      const isoString = `2026-01-01T${hours}:${minutes}:00+09:00`;
      const date = new Date(isoString);

      if (!isNaN(date.getTime())) {
        const userTime = date.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        });
        setLocalFormatted(userTime);
      }
    } catch {
      // Keep JST default on any date parsing quirks
    }
  }, [time]);

  if (!time) return null;

  // SSR or unmounted fallback
  if (!mounted || !localFormatted) {
    return (
      <span className={`whitespace-nowrap font-mono text-ink-faint ${className}`} title="Japan Standard Time">
        {time} JST
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-ink-dim cursor-help ${className}`}
      title={`Converted from ${time} JST (${day ? `${day} ` : ""}Japan Standard Time)`}
    >
      <span className="text-cyan font-medium">{localFormatted}</span>
      <span className="text-[9px] text-ink-faint uppercase">Local</span>
    </span>
  );
}
