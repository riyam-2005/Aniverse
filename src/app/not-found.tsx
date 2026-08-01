import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="eyebrow mb-3">Error 404</p>
      <h1 className="font-display text-6xl tracking-wide text-ink">
        This episode doesn&apos;t exist.
      </h1>
      <p className="mt-4 max-w-md text-sm text-ink-dim">
        The title you&apos;re looking for isn&apos;t in the guide. It may
        have been removed or the link is off.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Back to AniVerse
      </Link>
    </div>
  );
}
