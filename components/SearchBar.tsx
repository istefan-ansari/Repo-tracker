"use client";

/**
 * Search bar with debounced input and sort controls.
 * Keeps search state in the URL via query params.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SortOption } from "@/lib/types";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) ?? "stars"
  );

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Push updated search params to the URL (triggers page re-render via searchParams) */
  const updateUrl = useCallback(
    (q: string, s: SortOption) => {
      const params = new URLSearchParams();
      if (q.trim()) {
        params.set("q", q.trim());
        params.set("sort", s);
        params.set("page", "1");
      }
      router.push(`/?${params.toString()}`);
    },
    [router]
  );

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);

    // Debounce URL update by 500ms
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => updateUrl(q, sort), 500);
  }

  function handleSortChange(newSort: SortOption) {
    setSort(newSort);
    if (query.trim()) updateUrl(query, newSort);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    updateUrl(query, sort);
  }

  // Clean up timer on unmount
  useEffect(() => () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  }, []);

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      {/* Search input */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <span
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--color-text-muted)",
            fontSize: 16,
            pointerEvents: "none",
          }}
        >
          🔍
        </span>
        <input
          id="search-input"
          type="text"
          className="input"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search repositories… (e.g. next.js, machine learning)"
          aria-label="Search repositories"
          style={{ paddingLeft: 40 }}
          autoComplete="off"
          autoFocus
        />
      </div>

      {/* Sort controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{ fontSize: 13, color: "var(--color-text-muted)", flexShrink: 0 }}
        >
          Sort by:
        </span>
        {(["stars", "updated"] as SortOption[]).map((opt) => (
          <button
            key={opt}
            type="button"
            id={`sort-${opt}`}
            onClick={() => handleSortChange(opt)}
            className="btn"
            style={{
              fontSize: 12,
              padding: "5px 12px",
              background: sort === opt ? "var(--color-bg-tertiary)" : "transparent",
              border:
                sort === opt
                  ? "1px solid var(--color-accent-start)"
                  : "1px solid var(--color-border)",
              color:
                sort === opt
                  ? "var(--color-accent-start)"
                  : "var(--color-text-secondary)",
            }}
          >
            {opt === "stars" ? "⭐ Stars" : "🕒 Recently Updated"}
          </button>
        ))}
      </div>
    </form>
  );
}
