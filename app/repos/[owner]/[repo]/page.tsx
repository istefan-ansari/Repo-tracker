/**
 * Repository detail page.
 *
 * Static shell renders immediately; all async data fetching happens inside a
 * <Suspense> boundary so Next.js 16 can prerender the shell without blocking.
 *
 * Route: /repos/[owner]/[repo]
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import type { Commit, Contributor, Repository } from "@/lib/types";
import { formatNumber, getLanguageColor, timeAgo } from "@/lib/utils";
import SaveButton from "./SaveButton";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PageData {
  repository: Repository | null;
  commits: Commit[];
  contributors: Contributor[];
  error?: string;
  isRateLimit?: boolean;
  isSaved?: boolean;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchPageData(owner: string, repo: string): Promise<PageData> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const detailRes = await fetch(`${baseUrl}/api/repos/${owner}/${repo}`, {
    cache: "no-store",
  });

  if (!detailRes.ok) {
    const data = await detailRes.json().catch(() => ({}));
    return {
      repository: null,
      commits: [],
      contributors: [],
      error: data.error ?? "Repository not found.",
      isRateLimit: data.isRateLimit,
    };
  }

  const detail = await detailRes.json();

  // Check saved status
  let isSaved = false;
  if (detail.repository?.id) {
    try {
      const savedCheck = await fetch(
        `${baseUrl}/api/saved/${detail.repository.id}`,
        { cache: "no-store" }
      );
      if (savedCheck.ok) {
        const savedData = await savedCheck.json();
        isSaved = savedData.isSaved;
      }
    } catch {
      /* non-fatal */
    }
  }

  return {
    repository: detail.repository,
    commits: detail.commits ?? [],
    contributors: detail.contributors ?? [],
    isSaved,
  };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(props: {
  params: Promise<{ owner: string; repo: string }>;
}): Promise<Metadata> {
  const { owner, repo } = await props.params;
  return {
    title: `${owner}/${repo}`,
    description: `Repository details, commits, and contributors for ${owner}/${repo}`,
  };
}

// ─── Content component (inside Suspense) ──────────────────────────────────────

async function RepoDetailContent({
  owner,
  repo,
}: {
  owner: string;
  repo: string;
}) {
  const data = await fetchPageData(owner, repo);

  /* ── Error / Not Found ── */
  if (data.error || !data.repository) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>
          {data.isRateLimit ? "⏱️" : "😕"}
        </div>
        <h1 style={{ marginBottom: 12 }}>
          {data.isRateLimit ? "Rate Limit Reached" : "Repository Not Found"}
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: 24, fontSize: 15 }}>
          {data.isRateLimit
            ? "GitHub API rate limit exceeded. Please wait a few minutes before trying again."
            : data.error ?? `The repository "${owner}/${repo}" could not be found or has been deleted.`}
        </p>
        <Link href="/" className="btn btn-primary">
          ← Back to Search
        </Link>
      </div>
    );
  }

  const { repository: r, commits, contributors } = data;
  const langColor = getLanguageColor(r.language);

  return (
    <>
      {/* ─── Back link ─── */}
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--color-text-secondary)",
          fontSize: 13,
          marginBottom: 28,
          transition: "color var(--transition-fast)",
        }}
      >
        ← Back to Search
      </Link>

      {/* ─── Repo header card ─── */}
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <Image
            src={r.owner.avatar_url}
            alt={`${r.owner.login} avatar`}
            width={60}
            height={60}
            style={{ borderRadius: "var(--radius-md)", flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: "clamp(1.2rem, 3vw, 1.6rem)", fontWeight: 700, marginBottom: 6 }}>
              <a
                href={r.owner.html_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {r.owner.login}
              </a>
              <span style={{ color: "var(--color-text-muted)", margin: "0 4px" }}>/</span>
              <a
                href={r.html_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--color-accent-start)" }}
              >
                {r.name}
              </a>
            </h1>

            {r.description && (
              <p style={{ color: "var(--color-text-secondary)", fontSize: 15, marginBottom: 12, lineHeight: 1.5 }}>
                {r.description}
              </p>
            )}

            {/* Topics */}
            {r.topics && r.topics.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {r.topics.map((t) => (
                  <span
                    key={t}
                    className="badge"
                    style={{ color: "var(--color-accent-start)", borderColor: "rgba(88,166,255,0.3)" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 14 }}>
              {r.language && (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: langColor }} />
                  {r.language}
                </span>
              )}
              <span style={{ color: "var(--color-star)", display: "flex", alignItems: "center", gap: 5 }}>
                ★ {formatNumber(r.stargazers_count)} stars
              </span>
              <span style={{ color: "var(--color-fork)", display: "flex", alignItems: "center", gap: 5 }}>
                ⑂ {formatNumber(r.forks_count)} forks
              </span>
              <span style={{ color: "var(--color-issue)", display: "flex", alignItems: "center", gap: 5 }}>
                ● {formatNumber(r.open_issues_count)} open issues
              </span>
              {r.license?.name && (
                <span style={{ color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                  ⚖ {r.license.name}
                </span>
              )}
            </div>
          </div>

          {/* Save button (client component) */}
          <SaveButton
            repo={{
              githubId: r.id,
              fullName: r.full_name,
              description: r.description,
              language: r.language,
              stars: r.stargazers_count,
              forks: r.forks_count,
              openIssues: r.open_issues_count,
              htmlUrl: r.html_url,
              ownerLogin: r.owner.login,
              ownerAvatarUrl: r.owner.avatar_url,
              pushedAt: r.pushed_at,
            }}
            initialSaved={data.isSaved ?? false}
          />
        </div>

        <div className="divider" style={{ margin: "20px 0 16px" }} />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: "var(--color-text-muted)" }}>
          <span>Last push: {timeAgo(r.pushed_at)}</span>
          <span>Updated: {timeAgo(r.updated_at)}</span>
          <a
            href={r.html_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-accent-start)", marginLeft: "auto" }}
          >
            View on GitHub →
          </a>
        </div>
      </div>

      {/* ─── Two-column grid: commits + contributors ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {/* Commits */}
        <section className="card" style={{ padding: 24 }} aria-label="Latest commits">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span>📝</span> Latest Commits
          </h2>
          {commits.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>No commits available.</p>
          ) : (
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
              {commits.map((commit) => (
                <li key={commit.sha}>
                  <a
                    href={commit.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "block", textDecoration: "none" }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      {commit.author?.avatar_url && (
                        <Image
                          src={commit.author.avatar_url}
                          alt={commit.author.login}
                          width={28}
                          height={28}
                          style={{ borderRadius: "50%", flexShrink: 0, marginTop: 2 }}
                        />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <p
                          className="line-clamp-2"
                          style={{ fontSize: 13, color: "var(--color-text-primary)", fontWeight: 500, marginBottom: 3, lineHeight: 1.4 }}
                        >
                          {commit.commit.message.split("\n")[0]}
                        </p>
                        <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                          {commit.commit.author.name} · {timeAgo(commit.commit.author.date)} ·{" "}
                          <span style={{ fontFamily: "var(--font-geist-mono)", color: "var(--color-accent-end)" }}>
                            {commit.sha.slice(0, 7)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </a>
                  <div className="divider" style={{ marginTop: 14 }} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Contributors */}
        <section className="card" style={{ padding: 24 }} aria-label="Top contributors">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span>👥</span> Top Contributors
          </h2>
          {contributors.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
              Contributor data unavailable for this repository.
            </p>
          ) : (
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {contributors.map((contributor, idx) => (
                <li key={contributor.login}>
                  <a
                    href={contributor.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-bg-tertiary)",
                      transition: "background var(--transition-fast)",
                      textDecoration: "none",
                    }}
                  >
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background:
                          idx === 0 ? "rgba(240,200,74,0.2)" :
                          idx === 1 ? "rgba(192,192,192,0.2)" :
                          idx === 2 ? "rgba(205,127,50,0.2)" : "var(--color-bg-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color:
                          idx === 0 ? "#f0c84a" :
                          idx === 1 ? "#bbb" :
                          idx === 2 ? "#cd7f32" : "var(--color-text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <Image
                      src={contributor.avatar_url}
                      alt={contributor.login}
                      width={32}
                      height={32}
                      style={{ borderRadius: "50%", flexShrink: 0 }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--color-text-primary)",
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {contributor.login}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)", flexShrink: 0 }}>
                      {contributor.contributions.toLocaleString()} commits
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

// ─── Detail page skeleton ─────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div>
      <div className="skeleton" style={{ width: 100, height: 14, marginBottom: 28, borderRadius: 4 }} />
      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16 }}>
          <div className="skeleton" style={{ width: 60, height: 60, borderRadius: 10 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 22, width: "50%", marginBottom: 10, borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 14, width: "80%", marginBottom: 8, borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 14, width: "60%", borderRadius: 4 }} />
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        {[0, 1].map((i) => (
          <div key={i} className="card" style={{ padding: 24 }}>
            <div className="skeleton" style={{ height: 16, width: 140, marginBottom: 16, borderRadius: 4 }} />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} style={{ marginBottom: 14 }}>
                <div className="skeleton" style={{ height: 13, width: "90%", marginBottom: 6, borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 11, width: "50%", borderRadius: 4 }} />
                <div className="divider" style={{ marginTop: 14 }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RepoDetailPage(props: {
  params: Promise<{ owner: string; repo: string }>;
}) {
  const { owner, repo } = await props.params;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
      <Suspense fallback={<DetailSkeleton />}>
        <RepoDetailContent owner={owner} repo={repo} />
      </Suspense>
    </div>
  );
}
