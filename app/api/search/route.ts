/**
 * GET /api/search
 *
 * Proxy endpoint for GitHub repository search.
 * Accepts query parameters:
 *   - q       (required) Search keyword
 *   - sort    "stars" | "updated"  (default: "stars")
 *   - page    page number           (default: 1)
 *   - perPage results per page      (default: 9)
 *
 * Results are cached for 5 minutes inside the GitHub client.
 */

import { NextRequest } from "next/server";
import { searchRepositories, GitHubApiError } from "@/lib/github";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const q = searchParams.get("q")?.trim();
  const sort = (searchParams.get("sort") ?? "stars") as "stars" | "updated";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const perPage = Math.min(
    30,
    Math.max(1, Number(searchParams.get("perPage") ?? "9"))
  );

  // Validate required parameter
  if (!q) {
    return Response.json(
      { error: "Query parameter 'q' is required." },
      { status: 400 }
    );
  }

  if (!["stars", "updated"].includes(sort)) {
    return Response.json(
      { error: "Invalid sort value. Use 'stars' or 'updated'." },
      { status: 400 }
    );
  }

  try {
    const data = await searchRepositories(q, sort, page, perPage);
    return Response.json(data);
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
    console.error("[/api/search] Unexpected error:", err);
    return Response.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
