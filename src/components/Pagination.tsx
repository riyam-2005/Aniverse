import Link from "next/link";

/**
 * Server-rendered pagination — builds Prev/Next links by copying the
 * current search params and overwriting `page`. No client component
 * needed, so pages stay statically cacheable per query string.
 */
export default function Pagination({
  currentPage,
  hasNextPage,
  basePath,
  searchParams,
}: {
  currentPage: number;
  hasNextPage: boolean;
  basePath: string;
  /** Existing query params to preserve (e.g. `q`, `id`, `day`). */
  searchParams: Record<string, string | undefined>;
}) {
  if (currentPage <= 1 && !hasNextPage) return null;

  const hrefFor = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex items-center justify-center gap-3"
    >
      {currentPage > 1 ? (
        <Link href={hrefFor(currentPage - 1)} className="btn-secondary">
          Previous
        </Link>
      ) : (
        <span className="btn-secondary cursor-not-allowed opacity-40">
          Previous
        </span>
      )}

      <span className="font-mono text-xs text-ink-faint">
        Page {currentPage}
      </span>

      {hasNextPage ? (
        <Link href={hrefFor(currentPage + 1)} className="btn-secondary">
          Next
        </Link>
      ) : (
        <span className="btn-secondary cursor-not-allowed opacity-40">
          Next
        </span>
      )}
    </nav>
  );
}
