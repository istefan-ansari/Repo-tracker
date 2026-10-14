/**
 * GET /api/repos/[owner]/[repo]
 *
 * Returns full repository details including:
 *   - Repository metadata
 *   - Latest 5 commits
 *   - Top 5 contributors
 *
 * All data is fetched via the backend GitHub client so the token
 * never leaks to the browser.
 */

import type { NextRequest } from "next/server";
import {
  getRepository,
  getLatestCommits,
  getTopContributors,
  GitHubApiError,
} from "@/lib/github";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/repos/[owner]/[repo]">
) {
  const { owner, repo } = await ctx.params;

  if (!owner || !repo) {
    return Response.json(
      { error: "Owner and repository name are required." },
      { status: 400 }
    );
  }

  try {
    // Fetch all three data sources concurrently for speed
    const [repository, commits, contributors] = await Promise.all([
      getRepository(owner, repo),
      getLatestCommits(owner, repo).catch(() => []), // Non-fatal; some repos have no commits
      getTopContributors(owner, repo).catch(() => []), // Non-fatal; some repos block this endpoint
    ]);

    return Response.json({ repository, commits, contributors });
  } catch (err) {
    if (err instanceof GitHubApiError) {
      return Response.json(
        {
          error: err.message,
          isRateLimit: err.isRateLimit,
        },
        { status: err.status || 502 }
      );
    }
    console.error(`[/api/repos/${owner}/${repo}] Unexpected error:`, err);
    return Response.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
