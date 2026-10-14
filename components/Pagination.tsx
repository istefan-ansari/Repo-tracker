"use client";

/**
 * Pagination controls for search results.
 * Updates the `page` query param in the URL.
 */

import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  perPage: number;
}

export default function Pagination({
  currentPage,
  totalCount,
  perPage,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.min(Math.ceil(totalCount / perPage), 34); // GitHub caps at 1000 results

  if (totalPages <= 1) return null;

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/?${params.toString()}`);
  }

  // Build visible page numbers (show at most 5 pages around current)
  const pages: (number | "…")[] = [];
  const delta = 2;
  const left = currentPage - delta;
  const right = currentPage + delta;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
      pages.push(i);
    } else if (i === left - 1 || i === right + 1) {
      pages.push("…");
    }
  }

  return (
    <nav
      aria-label="Pagination"
      style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}
    >
      {/* Previous */}
      <button
        id="pagination-prev"
        className="btn btn-secondary"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        style={{ fontSize: 13, padding: "6px 12px" }}
        aria-label="Previous page"
      >
        ← Prev
      </button>

      {/* Page numbers */}
      {pages.map((page, idx) =>
        page === "…" ? (
          <span
            key={`ellipsis-${idx}`}
            style={{ color: "var(--color-text-muted)", padding: "0 4px" }}
          >
            …
          </span>
        ) : (
          <button
            key={page}
            id={`page-btn-${page}`}
            className="btn"
            onClick={() => goToPage(page as number)}
            aria-current={page === currentPage ? "page" : undefined}
            style={{
              fontSize: 13,
              padding: "6px 12px",
              background:
                page === currentPage
                  ? "linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end))"
                  : "var(--color-bg-tertiary)",
              border:
                page === currentPage
                  ? "none"
                  : "1px solid var(--color-border)",
              color:
                page === currentPage
                  ? "#fff"
                  : "var(--color-text-secondary)",
              fontWeight: page === currentPage ? 600 : 400,
            }}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        id="pagination-next"
        className="btn btn-secondary"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{ fontSize: 13, padding: "6px 12px" }}
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}
