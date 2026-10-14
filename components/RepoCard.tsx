"use client";

/**
 * Repository card displayed on the search results page.
 *
 * Shows: name, description, language, stars, forks, open issues,
 *        last updated, and a Save / Saved toggle button.
 */

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { Repository } from "@/lib/types";
import { formatNumber, getLanguageColor, timeAgo } from "@/lib/utils";
import { showToast } from "@/components/ToastProvider";

// ─── Props ────────────────────────────────────────────────────────────────────

interface RepoCardProps {
  repo: Repository;
  /** Set to true if this repo is already in the user's saved list */
  initialSaved?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RepoCard({ repo, initialSaved = false }: RepoCardProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  const langColor = getLanguageColor(repo.language);

  async function handleSaveToggle(e: React.MouseEvent) {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();

    setLoading(true);
    try {
      if (saved) {
        // Remove from saved
        const res = await fetch(`/api/saved/${repo.id}`, { method: "DELETE" });
        if (res.ok || res.status === 404) {
          setSaved(false);
          showToast(`"${repo.name}" removed from saved.`, "info");
        } else {
          showToast("Failed to remove repository.", "error");
        }
      } else {
        // Save repository
        const res = await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            githubId: repo.id,
            fullName: repo.full_name,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            openIssues: repo.open_issues_count,
            htmlUrl: repo.html_url,
            ownerLogin: repo.owner.login,
            ownerAvatarUrl: repo.owner.avatar_url,
            pushedAt: repo.pushed_at,
          }),
        });

        if (res.ok || res.status === 201) {
          setSaved(true);
          showToast(`"${repo.name}" saved to favourites!`, "success");
        } else if (res.status === 409) {
          setSaved(true); // Already saved
          showToast("Already in your saved list.", "warning");
        } else {
          showToast("Failed to save repository.", "error");
        }
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  const [owner, repoName] = repo.full_name.split("/");

  return (
    <Link
      href={`/repos/${owner}/${repoName}`}
      className="card animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 20,
        cursor: "pointer",
        textDecoration: "none",
      }}
    >
      {/* Header: avatar + name */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Image
          src={repo.owner.avatar_url}
          alt={`${repo.owner.login} avatar`}
          width={40}
          height={40}
          style={{ borderRadius: "var(--radius-sm)", flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--color-accent-start)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {repo.full_name}
          </h3>
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

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          fontSize: 13,
          color: "var(--color-text-secondary)",
        }}
      >
        {/* Language */}
        {repo.language && (
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: langColor,
                flexShrink: 0,
              }}
            />
            {repo.language}
          </span>
        )}

        {/* Stars */}
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "var(--color-star)" }}>★</span>
          {formatNumber(repo.stargazers_count)}
        </span>

        {/* Forks */}
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "var(--color-fork)" }}>⑂</span>
          {formatNumber(repo.forks_count)}
        </span>

        {/* Open issues */}
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "var(--color-issue)" }}>●</span>
          {formatNumber(repo.open_issues_count)} issues
        </span>

        {/* Updated */}
        <span style={{ marginLeft: "auto" }}>
          {timeAgo(repo.pushed_at ?? repo.updated_at)}
        </span>
      </div>

      {/* Divider */}
      <div className="divider" />

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          id={`save-btn-${repo.id}`}
          className={`btn ${saved ? "btn-saved" : "btn-secondary"}`}
          onClick={handleSaveToggle}
          disabled={loading}
          aria-label={saved ? "Remove from saved" : "Save repository"}
          style={{ fontSize: 13 }}
        >
          {loading ? (
            <span className="animate-spin" style={{ display: "inline-block" }}>
              ⟳
            </span>
          ) : saved ? (
            "★ Saved"
          ) : (
            "☆ Save"
          )}
        </button>
      </div>
    </Link>
  );
}
