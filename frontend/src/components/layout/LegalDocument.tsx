import type { ReactNode } from "react";

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

export default function LegalDocument({
  eyebrow,
  title,
  lastUpdated,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  intro?: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="container-page max-w-3xl py-14">
      <p className="eyebrow mb-1.5">{eyebrow}</p>
      <h1 className="font-display text-5xl tracking-wide text-ink">{title}</h1>
      <p className="mt-3 font-mono text-xs text-ink-faint">
        Last updated: {lastUpdated}
      </p>

      {intro && (
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink-dim">
          {intro}
        </div>
      )}

      <div className="mt-10 space-y-10">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-xl tracking-wide text-ink">
              {section.heading}
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-dim">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
