"use client";

import { useEffect, useState } from "react";

interface HealthResponse {
  status: "ok" | "degraded";
  checks: {
    db: { status: "ok" | "down"; error?: string };
    jikan: { status: "ok" | "degraded" | "down"; failures: number; circuitOpen: boolean; backend: "redis" | "memory" };
  };
  process: { uptimeSeconds: number; memoryMb: number };
  responseTimeMs: number;
  time: string;
}

const POLL_INTERVAL_MS = 10_000;
const HISTORY_LENGTH = 30;

function StatusPill({ status }: { status: "ok" | "degraded" | "down" }) {
  const styles: Record<string, string> = {
    ok: "bg-cyan/15 text-cyan",
    degraded: "bg-amber/15 text-amber",
    down: "bg-pink/15 text-pink",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] uppercase ${styles[status]}`}>
      {status}
    </span>
  );
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function MonitoringPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const data: HealthResponse = await res.json();
        if (cancelled) return;
        setHealth(data);
        setError(false);
        setLastUpdated(new Date());
        setHistory((prev) => [...prev.slice(-(HISTORY_LENGTH - 1)), data.responseTimeMs]);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!health) {
    return (
      <div className="space-y-3">
        <div className="h-24 w-full skeleton rounded-xl bg-panel2" />
        <div className="h-32 w-full skeleton rounded-xl bg-panel2" />
      </div>
    );
  }

  const maxRt = Math.max(1, ...history);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-pink/40 bg-pink/10 px-4 py-2 text-sm text-pink">
          Lost contact with /api/health — showing the last known state.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-ink-faint">Database</p>
            <StatusPill status={health.checks.db.status} />
          </div>
          {health.checks.db.error && (
            <p className="mt-2 truncate text-xs text-ink-faint" title={health.checks.db.error}>
              {health.checks.db.error}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-line bg-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-ink-faint">Jikan API</p>
            <StatusPill status={health.checks.jikan.status} />
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            {health.checks.jikan.failures} recent failure{health.checks.jikan.failures === 1 ? "" : "s"} ·
            circuit {health.checks.jikan.circuitOpen ? "open" : "closed"} · {health.checks.jikan.backend} backend
          </p>
        </div>

        <div className="rounded-xl border border-line bg-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-ink-faint">Process</p>
            <span className="font-mono text-[11px] text-ink-faint">
              {formatUptime(health.process.uptimeSeconds)}
            </span>
          </div>
          <p className="mt-2 text-xs text-ink-faint">{health.process.memoryMb} MB resident memory</p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-ink">Health check latency</h2>
          <span className="font-mono text-xs text-ink-faint">
            {health.responseTimeMs}ms last · updated {lastUpdated?.toLocaleTimeString()}
          </span>
        </div>
        <div className="flex h-20 items-end gap-1 rounded-xl border border-line bg-panel p-3">
          {history.map((rt, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-cyan opacity-70"
              style={{ height: `${Math.max(4, (rt / maxRt) * 100)}%` }}
              title={`${rt}ms`}
            />
          ))}
          {history.length === 0 && <p className="text-xs text-ink-faint">Collecting samples…</p>}
        </div>
      </div>
    </div>
  );
}
