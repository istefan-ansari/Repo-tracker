/**
 * GitHub API client.
 *
 * Centralises all GitHub REST API calls so that:
 *  - Authentication headers are applied consistently.
 *  - Rate-limit responses are detected and surfaced as structured errors.
 *  - API responses are strongly typed.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  pushed_at: string | null;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  topics?: string[];
  license?: { name: string } | null;
  watchers_count?: number;
}

export interface GitHubSearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  html_url: string;
}

export interface GitHubContributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

// ─── Error Types ─────────────────────────────────────────────────────────────

export class GitHubApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly isRateLimit: boolean = false
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

// ─── Client ──────────────────────────────────────────────────────────────────

const GITHUB_API_BASE = process.env.GITHUB_API_BASE_URL ?? "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * Build common headers for GitHub API requests.
 * Including the token raises the rate limit from 60 to 5,000 req/hr.
 */
function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
  }

  return headers;
}

/**
 * Core fetch wrapper that handles common GitHub API error cases:
 *  - 403 / 429 → rate limit
 *  - 404       → not found / deleted repo
 *  - 5xx       → GitHub service error
 */
async function githubFetch<T>(path: string): Promise<T> {
  const url = path.startsWith("http") ? path : `${GITHUB_API_BASE}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: buildHeaders(),
      // Do not cache at the Next.js layer; we implement our own TTL cache
      cache: "no-store",
    });
  } catch (networkError) {
    throw new GitHubApiError(
      0,
      `Network error reaching GitHub API: ${(networkError as Error).message}`
    );
  }

  // Rate-limit handling
  if (response.status === 403 || response.status === 429) {
    const resetHeader = response.headers.get("x-ratelimit-reset");
    const resetTime = resetHeader
      ? new Date(Number(resetHeader) * 1000).toISOString()
      : "unknown";
    throw new GitHubApiError(
      response.status,
      `GitHub API rate limit exceeded. Resets at ${resetTime}.`,
      true
    );
  }

  if (response.status === 404) {
    throw new GitHubApiError(
      404,
      "Repository not found or has been deleted."
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new GitHubApiError(
      response.status,
      `GitHub API error ${response.status}: ${body || response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

// ─── In-Memory Cache (5-minute TTL) ─────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Public API Functions ─────────────────────────────────────────────────────

/**
 * Search public GitHub repositories.
 * Results are cached for 5 minutes to reduce API quota usage.
 *
 * @param query    Search keyword(s)
 * @param sort     "stars" | "updated" (maps to GitHub's sort param)
 * @param page     1-based page number
 * @param perPage  Results per page (max 30 for safety)
 */
export async function searchRepositories(
  query: string,
  sort: "stars" | "updated" = "stars",
  page = 1,
  perPage = 9
): Promise<GitHubSearchResult> {
  const cacheKey = `search:${query}:${sort}:${page}:${perPage}`;
  const cached = getCached<GitHubSearchResult>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    q: query,
    sort,
    order: "desc",
    page: String(page),
    per_page: String(perPage),
  });

  const result = await githubFetch<GitHubSearchResult>(
    `/search/repositories?${params}`
  );

  setCached(cacheKey, result);
  return result;
}

/**
 * Fetch full repository details by owner and repo name.
 * Cached for 5 minutes.
 */
export async function getRepository(
  owner: string,
  repo: string
): Promise<GitHubRepo> {
  const cacheKey = `repo:${owner}/${repo}`;
  const cached = getCached<GitHubRepo>(cacheKey);
  if (cached) return cached;

  const result = await githubFetch<GitHubRepo>(`/repos/${owner}/${repo}`);
  setCached(cacheKey, result);
  return result;
}

/**
 * Fetch the latest 5 commits for a repository.
 * Cached for 5 minutes.
 */
export async function getLatestCommits(
  owner: string,
  repo: string
): Promise<GitHubCommit[]> {
  const cacheKey = `commits:${owner}/${repo}`;
  const cached = getCached<GitHubCommit[]>(cacheKey);
  if (cached) return cached;

  const result = await githubFetch<GitHubCommit[]>(
    `/repos/${owner}/${repo}/commits?per_page=5`
  );
  setCached(cacheKey, result);
  return result;
}

/**
 * Fetch the top 5 contributors for a repository.
 * Cached for 5 minutes.
 */
export async function getTopContributors(
  owner: string,
  repo: string
): Promise<GitHubContributor[]> {
  const cacheKey = `contributors:${owner}/${repo}`;
  const cached = getCached<GitHubContributor[]>(cacheKey);
  if (cached) return cached;

  const result = await githubFetch<GitHubContributor[]>(
    `/repos/${owner}/${repo}/contributors?per_page=5`
  );
  setCached(cacheKey, result);
  return result;
}
