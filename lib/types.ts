/**
 * Shared TypeScript types used across the application.
 * Mirrors the shapes returned by the GitHub API and our own backend.
 */

export interface Repository {
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

export interface Commit {
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

export interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export interface SavedRepo {
  _id: string;
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
  savedAt: string;
}

export type SortOption = "stars" | "updated";
