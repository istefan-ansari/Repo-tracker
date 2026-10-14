/**
 * Saved Repositories page.
 *
 * Server component shell — data is fetched inside a Suspense-wrapped
 * child component so the route can produce a static shell with a
 * skeleton fallback while the list streams in.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import type { SavedRepo } from "@/lib/types";
import SavedRepoList from "./SavedRepoList";

export const metadata: Metadata = {
  title: "Saved Repositories",
  description: "View and manage your saved GitHub repositories.",
};

// ─── Data fetching — lives inside Suspense boundary ──────────────────────────

async function SavedRepoData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  let repositories: SavedRepo[] = [];
  let error: string | undefined;

  try {
    const res = await fetch(`${baseUrl}/api/saved`, { cache: "no-store" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      error = data.error ?? "Failed to load saved repositories.";
    } else {
      const data = await res.json();
      repositories = data.repositories ?? [];
    }
  } catch {
    error = "Failed to reach the server. Is MongoDB connected?";
  }

  return (
    <>
      {/* Error banner */}
      {error && (
        <div
          style={{
            maxWidth: 600,
            padding: "16px 20px",
            borderRadius: "var(--radius-md)",
            background: "rgba(248, 81, 73, 0.1)",
            border: "1px solid rgba(248, 81, 73, 0.4)",
            color: "var(--color-danger)",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* Interactive list (client component) */}
      <SavedRepoList initialRepos={repositories} />
    </>
  );
}

// ─── Skeleton fallback while data is loading ──────────────────────────────────

function SavedListSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 16,
      }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
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
          <div style={{ display: "flex", gap: 12 }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 6 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 14, marginBottom: 8, borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 12, width: "70%", borderRadius: 4 }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div className="skeleton" style={{ width: 60, height: 12, borderRadius: 4 }} />
            <div className="skeleton" style={{ width: 50, height: 12, borderRadius: 4 }} />
          </div>
          <div className="skeleton" style={{ height: 1 }} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <div className="skeleton" style={{ width: 90, height: 32, borderRadius: 6 }} />
            <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SavedPage() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
      {/* Header — static, renders immediately */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: "clamp(1.6rem, 3vw, 2rem)",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          ⭐ Saved Repositories
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 15 }}>
          Your bookmarked GitHub repositories.
        </p>
      </div>

      {/* Data — streams in behind the skeleton */}
      <Suspense fallback={<SavedListSkeleton />}>
        <SavedRepoData />
      </Suspense>
    </div>
  );
}
