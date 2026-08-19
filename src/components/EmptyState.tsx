import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  icon?: string;
}

export default function EmptyState({
  title,
  description,
  actionText,
  actionHref,
  icon = "🎬",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-paper-border bg-paper-light p-12 text-center my-6">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-paper-hover text-3xl shadow-inner">
        {icon}
      </div>
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-ink-dim">{description}</p>
      {actionText && actionHref && (
        <Link href={actionHref} className="btn-primary mt-6">
          {actionText}
        </Link>
      )}
    </div>
  );
}
