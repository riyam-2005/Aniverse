"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Genre } from "@/types/anime";

const MIN_PICKS = 3;

export default function GenrePicker({ genres }: { genres: Genre[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function finish(skip: boolean) {
    setSaving(true);
    try {
      if (!skip && selected.size > 0) {
        await fetch("/api/user/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ genreIds: [...selected] }),
        });
      }
    } finally {
      router.push("/");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {genres.map((g) => (
          <button
            key={g.mal_id}
            type="button"
            onClick={() => toggle(g.mal_id)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              selected.has(g.mal_id)
                ? "border-cyan bg-cyan/10 text-cyan"
                : "border-line text-ink-dim hover:text-ink"
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => finish(true)}
          disabled={saving}
          className="font-mono text-xs text-ink-faint hover:text-ink disabled:opacity-50"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={() => finish(false)}
          disabled={saving || selected.size < MIN_PICKS}
          className="btn-primary rounded-full px-8 py-2.5 text-sm disabled:opacity-40"
        >
          {saving
            ? "Saving…"
            : selected.size < MIN_PICKS
              ? `Pick at least ${MIN_PICKS} (${selected.size}/${MIN_PICKS})`
              : "Continue"}
        </button>
      </div>
    </div>
  );
}
