import type { Metadata } from "next";
import MonitoringPanel from "@/components/admin/MonitoringPanel";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Monitoring — Admin",
  robots: { index: false, follow: false },
};

export default function AdminMonitoringPage() {
  return (
    <div>
      <p className="eyebrow mb-1.5">Dashboard</p>
      <h1 className="font-display text-4xl tracking-wide text-ink">Monitoring</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-dim">
        Live status of the database and the Jikan upstream API (including the circuit breaker
        state that also drives the fallback content on Trending/Genres). Refreshes every 10s.
        Unhandled server errors are logged as structured JSON — check your host&apos;s log viewer
        and search for <code className="rounded bg-panel2 px-1 py-0.5 font-mono text-xs">&quot;source&quot;:&quot;onRequestError&quot;</code>.
      </p>

      <div className="mt-8">
        <MonitoringPanel />
      </div>
    </div>
  );
}
