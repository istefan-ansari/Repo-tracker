/**
 * Home page — Repository Search
 *
 * The page shell is static (search bar + hero).
 * Search results are fetched inside a <Suspense>-wrapped async component
 * so Next.js 16 can prerender the shell and stream the results.
 *
 * URL params:
 *   q       - search query
 *   sort    - "stars" | "updated"
 *   page    - 1-based page number
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import type { Repository, SortOption } from "@/lib/types";
import SearchBar from "@/components/SearchBar";
import RepoCard from "@/components/RepoCard";
import Pagination from "@/components/Pagination";

// ─── Metadata ────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Search Repositories",
  description: "Search GitHub public repositories by keyword.",
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface SearchData {
  total_count: number;
  items: Repository[];
  error?: string;
  isRateLimit?: boolean;
}

interface HomePageProps {
  searchParams?: Promise<{
    q?: string;
    sort?: string;
    page?: string;
  }>;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

async function fetchSearchResults(
  q: string,
  sort: SortOption,
  page: number
): Promise<SearchData> {
  const params = new URLSearchParams({ q, sort, page: String(page), perPage: "9" });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/search?${params}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        total_count: 0,
        items: [],
        error: data.error ?? "An error occurred.",
        isRateLimit: data.isRateLimit,
      };
    }
    return data;
  } catch {
    return {
      total_count: 0,
      items: [],
      error: "Failed to reach the server. Please try again.",
    };
  }
}

async function fetchSavedIds(): Promise<Set<number>> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/saved`, { cache: "no-store" });
    if (!res.ok) return new Set();
    const data = await res.json();
    return new Set(
      (data.repositories ?? []).map((r: { githubId: number }) => r.githubId)
    );
  } catch {
    return new Set();
  }
}

// ─── Search Results (async, lives inside Suspense) ────────────────────────────

async function SearchResults({
  q,
  sort,
  page,
}: {
  q: string;
  sort: SortOption;
  page: number;
}) {
  const PER_PAGE = 9;
  const [searchData, savedIds] = await Promise.all([
    fetchSearchResults(q, sort, page),
    fetchSavedIds(),
  ]);

  const hasResults = (searchData.items?.length ?? 0) > 0;

  // ── Error state ──
  if (searchData.error) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto 32px",
          padding: "16px 20px",
          borderRadius: "var(--radius-md)",
          background: searchData.isRateLimit
            ? "rgba(210, 153, 34, 0.1)"
            : "rgba(248, 81, 73, 0.1)",
          border: `1px solid ${
            searchData.isRateLimit
              ? "rgba(210, 153, 34, 0.4)"
              : "rgba(248, 81, 73, 0.4)"
          }`,
          color: searchData.isRateLimit
            ? "var(--color-warning)"
            : "var(--color-danger)",
          fontSize: 14,
          textAlign: "center",
        }}
      >
        {searchData.isRateLimit
          ? "⚠️ GitHub API rate limit reached. Please wait a moment and try again."
          : `❌ ${searchData.error}`}
      </div>
    );
  }

  // ── No results state ──
  if (!hasResults) {
    return (
      <div style={{ textAlign: "center", padding: "60px 24px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 style={{ marginBottom: 8, color: "var(--color-text-primary)" }}>
          No results found for &ldquo;{q}&rdquo;
        </h2>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Try different keywords or check your spelling.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Result count */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
          {searchData.total_count.toLocaleString()} results for{" "}
          <strong style={{ color: "var(--color-text-primary)" }}>
            &ldquo;{q}&rdquo;
          </strong>{" "}
          — page {page}
        </p>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}
      >
        {searchData.items.map((repo, idx) => (
          <div
            key={repo.id}
            className={`stagger-${Math.min(idx + 1, 9)}`}
            style={{ opacity: 0, animation: "fadeIn 0.4s ease forwards" }}
          >
            <RepoCard repo={repo} initialSaved={savedIds.has(repo.id)} />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Suspense>
          <Pagination
            currentPage={page}
            totalCount={searchData.total_count}
            perPage={PER_PAGE}
          />
        </Suspense>
      </div>
    </>
  );
}

// ─── Results skeleton ─────────────────────────────────────────────────────────

function ResultsSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 16,
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 6, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 14, marginBottom: 8, borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 12, width: "70%", borderRadius: 4 }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="skeleton" style={{ width: 60, height: 12, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 50, height: 12, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 55, height: 12, borderRadius: 4 }} />
          </div>
          <div className="skeleton" style={{ height: 1 }} />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div className="skeleton" style={{ width: 72, height: 32, borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;

  const q = (searchParams?.q as string | undefined) ?? "";
  const sort = ((searchParams?.sort as string | undefined) ?? "stars") as SortOption;
  const page = Math.max(1, Number(searchParams?.page ?? "1"));

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      {/* Hero — static, always visible immediately */}
      {!q && (
        <div style={{ textAlign: "center", marginBottom: 48, animation: "fadeIn 0.5s ease" }}>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            Discover{" "}
            <span className="gradient-text">GitHub Repositories</span>
          </h1>
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "var(--color-text-secondary)",
              maxWidth: 560,
              margin: "0 auto 32px",
            }}
          >
            Search millions of public repositories. Explore commits, contributors,
            and save your favourites — all in one place.
          </p>
        </div>
      )}

      {/* Search bar — static shell, uses client-side router */}
      <div style={{ maxWidth: 700, margin: "0 auto 40px", position: "relative" }}>
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      {/* Results — streamed behind skeleton */}
      {q ? (
        <Suspense fallback={<ResultsSkeleton />}>
          <SearchResults q={q} sort={sort} page={page} />
        </Suspense>
      ) : (
        /* Suggestion chips — static */
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 20,
            flexWrap: "wrap",
            marginTop: 8,
          }}
        >
          {["react", "next.js", "python", "machine-learning", "rust"].map(
            (suggestion) => (
              <a
                key={suggestion}
                href={`/?q=${encodeURIComponent(suggestion)}&sort=stars&page=1`}
                className="badge"
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "border-color var(--transition-fast), color var(--transition-fast)",
                }}
              >
                {suggestion}
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}
