"use client";

/**
 * Save / Unsave button for the repository detail page.
 * Client component so it can manage interactive state.
 */

import { useState } from "react";
import { showToast } from "@/components/ToastProvider";

interface RepoPayload {
  githubId: number;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  htmlUrl: string;
  ownerLogin: string;
  ownerAvatarUrl: string;
  pushedAt: string | null;
}

interface SaveButtonProps {
  repo: RepoPayload;
  initialSaved: boolean;
}

export default function SaveButton({ repo, initialSaved }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      if (saved) {
        const res = await fetch(`/api/saved/${repo.githubId}`, {
          method: "DELETE",
        });
        if (res.ok || res.status === 404) {
          setSaved(false);
          showToast("Removed from saved repositories.", "info");
        } else {
          showToast("Failed to remove repository.", "error");
        }
      } else {
        const res = await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(repo),
        });
        if (res.ok || res.status === 201) {
          setSaved(true);
          showToast("Saved to your favourites!", "success");
        } else if (res.status === 409) {
          setSaved(true);
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

  return (
    <button
      id="detail-save-btn"
      className={`btn ${saved ? "btn-saved" : "btn-primary"}`}
      onClick={handleToggle}
      disabled={loading}
      aria-label={saved ? "Remove from saved" : "Save this repository"}
      style={{ alignSelf: "flex-start", flexShrink: 0 }}
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
  );
}
