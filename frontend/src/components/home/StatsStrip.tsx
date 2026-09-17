export default function StatsStrip() {
  const stats = [
    {
      value: "25,430+",
      label: "Anime Database",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="m9 8 7 4-7 4Z" />
        </svg>
      ),
    },
    {
      value: "732,816+",
      label: "Registered Users",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      value: "14,902,331",
      label: "Episodes Tracked",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber">
          <rect width="20" height="15" x="2" y="7" rx="2" ry="2" />
          <polyline points="17 2 12 7 7 2" />
        </svg>
      ),
    },
    {
      value: "2.1M+",
      label: "Community Reviews",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple">
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
      ),
    },
    {
      value: "99.9%",
      label: "System Uptime",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
          <path d="M12 2v4" />
          <path d="m4.93 4.93 2.83 2.83" />
          <path d="M2 12h4" />
          <path d="m4.93 19.07 2.83-2.83" />
          <path d="M12 18v4" />
          <path d="m19.07 19.07-2.83-2.83" />
          <path d="M18 12h4" />
          <path d="m19.07 4.93-2.83 2.83" />
        </svg>
      ),
    },
    {
      value: "AI Powered",
      label: "Recommendations",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink">
          <path d="M12 3a9 9 0 0 0-9 9c0 3.87 2.5 7.15 6 8.47V21a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-.53c3.5-1.32 6-4.6 6-8.47a9 9 0 0 0-9-9Z" />
          <path d="M9 10h.01" />
          <path d="M15 10h.01" />
        </svg>
      ),
    },
  ];

  return (
    <section className="container-page py-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center rounded-2xl border border-line bg-panel/80 p-4 text-center backdrop-blur-sm transition-all hover:border-pink/30 hover:bg-panel2"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-panel2 border border-line">
              {stat.icon}
            </div>
            <p className="font-mono text-sm font-bold text-ink">
              {stat.value}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-faint">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
