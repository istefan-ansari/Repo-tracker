/**
 * DELETE /api/saved/[githubId]
 *
 * Removes a saved repository by its GitHub repository ID.
 * Returns 404 if the repository is not in the saved list.
 */

import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import SavedRepository from "@/lib/models/SavedRepository";

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/saved/[githubId]">
) {
  const { githubId } = await ctx.params;
  const id = Number(githubId);

  if (!githubId || isNaN(id)) {
    return Response.json(
      { error: "A valid numeric GitHub repository ID is required." },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const deleted = await SavedRepository.findOneAndDelete({ githubId: id });

    if (!deleted) {
      return Response.json(
        { error: "Repository not found in saved list." },
        { status: 404 }
      );
    }

    return Response.json({ message: "Repository removed from saved list." });
  } catch (err) {
    console.error(`[DELETE /api/saved/${githubId}] Error:`, err);
    return Response.json(
      { error: "Failed to remove repository." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/saved/[githubId]
 *
 * Checks whether a specific repository is already saved.
 * Used by the UI to display the correct save/unsave state.
 */
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/saved/[githubId]">
) {
  const { githubId } = await ctx.params;
  const id = Number(githubId);

  if (!githubId || isNaN(id)) {
    return Response.json(
      { error: "A valid numeric GitHub repository ID is required." },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const repo = await SavedRepository.findOne({ githubId: id }).lean();

    return Response.json({ isSaved: !!repo, repository: repo ?? null });
  } catch (err) {
    console.error(`[GET /api/saved/${githubId}] Error:`, err);
    return Response.json(
      { error: "Failed to check saved status." },
      { status: 500 }
    );
  }
}
