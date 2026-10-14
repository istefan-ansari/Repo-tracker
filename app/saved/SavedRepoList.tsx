"use client";

/**
 * Client component for the saved repositories list.
 * Handles optimistic removal of saved repos without a full page reload.
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { SavedRepo } from "@/lib/types";
import { formatNumber, getLanguageColor, timeAgo } from "@/lib/utils";
import { showToast } from "@/components/ToastProvider";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SavedRepoListProps {
  initialRepos: SavedRepo[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SavedRepoList({ initialRepos }: SavedRepoListProps) {
  const [repos, setRepos] = useState<SavedRepo[]>(initialRepos);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());

  async function handleRemove(repo: SavedRepo) {
    setRemovingIds((prev) => new Set(prev).add(repo.githubId));

    try {
      const res = await fetch(`/api/saved/${repo.githubId}`, {
        method: "DELETE",
      });

      if (res.ok || res.status === 404) {
        // Optimistic UI removal
        setRepos((prev) => prev.filter((r) => r.githubId !== repo.githubId));
        showToast(`"${repo.fullName}" removed from saved.`, "info");
      } else {
        showToast("Failed to remove repository.", "error");
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(repo.githubId);
          return next;
        });
      }
    } catch {
      showToast("Network error. Please try again.", "error");
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(repo.githubId);
        return next;
      });
    }
  }

  /* ── Empty state ── */
  if (repos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>⭐</div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 10,
            color: "var(--color-text-primary)",
          }}
        >
          No saved repositories yet
        </h2>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: 28,
            fontSize: 15,
          }}
        >
          Search for repositories and click the ☆ Save button to add them here.
        </p>
        <Link href="/" className="btn btn-primary">
          Search Repositories
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 16,
      }}
    >
      {repos.map((repo, idx) => {
        const langColor = getLanguageColor(repo.language);
        const [owner, repoName] = repo.fullName.split("/");
        const isRemoving = removingIds.has(repo.githubId);

        return (
          <div
            key={repo.githubId}
            className={`card animate-fade-in stagger-${Math.min(idx + 1, 9)}`}
            style={{
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              opacity: isRemoving ? 0.4 : 1,
              transition: "opacity var(--transition-base)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <Image
                src={repo.ownerAvatarUrl}
                alt={`${repo.ownerLogin} avatar`}
                width={40}
                height={40}
                style={{ borderRadius: "var(--radius-sm)", flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link
                  href={`/repos/${owner}/${repoName}`}
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--color-accent-start)",
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {repo.fullName}
                </Link>
                <p
                  className="line-clamp-2"
                  style={{
                    fontSize: 13,
                    color: "var(--color-text-secondary)",
                    marginTop: 4,
                  }}
                >
                  {repo.description ?? "No description provided."}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                fontSize: 13,
                color: "var(--color-text-secondary)",
              }}
            >
              {repo.language && (
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: langColor,
                    }}
                  />
                  {repo.language}
                </span>
              )}
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "var(--color-star)" }}>★</span>
                {formatNumber(repo.stars)}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "var(--color-fork)" }}>⑂</span>
                {formatNumber(repo.forks)}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "var(--color-issue)" }}>●</span>
                {formatNumber(repo.openIssues)} issues
              </span>
              <span style={{ marginLeft: "auto" }}>
                Saved {timeAgo(repo.savedAt)}
              </span>
            </div>

            {/* Divider */}
            <div className="divider" />

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Link
                href={`/repos/${owner}/${repoName}`}
                className="btn btn-secondary"
                style={{ fontSize: 13 }}
              >
                View Details
              </Link>
              <button
                id={`remove-btn-${repo.githubId}`}
                className="btn btn-danger"
                onClick={() => handleRemove(repo)}
                disabled={isRemoving}
                aria-label={`Remove ${repo.fullName} from saved`}
                style={{ fontSize: 13 }}
              >
                {isRemoving ? (
                  <span className="animate-spin" style={{ display: "inline-block" }}>
                    ⟳
                  </span>
                ) : (
                  "✕ Remove"
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
