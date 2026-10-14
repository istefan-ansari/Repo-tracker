/**
 * GET  /api/saved       — List all saved repositories (newest first)
 * POST /api/saved       — Save a repository (returns 409 if already exists)
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import SavedRepository from "@/lib/models/SavedRepository";
import { ISavedRepository } from "@/lib/models/SavedRepository";

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    await connectDB();

    const repos = await SavedRepository.find()
      .sort({ savedAt: -1 }) // Newest saved first
      .lean();

    return Response.json({ repositories: repos });
  } catch (err) {
    console.error("[GET /api/saved] Error:", err);
    return Response.json(
      { error: "Failed to retrieve saved repositories." },
      { status: 500 }
    );
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: Partial<ISavedRepository>;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Validate required fields
  if (!body.githubId || !body.fullName || !body.htmlUrl) {
    return Response.json(
      { error: "Fields 'githubId', 'fullName', and 'htmlUrl' are required." },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    // Check for existing entry to provide a clear duplicate response
    const existing = await SavedRepository.findOne({ githubId: body.githubId });
    if (existing) {
      return Response.json(
        { error: "Repository is already saved.", repository: existing },
        { status: 409 }
      );
    }

    const saved = await SavedRepository.create({
      githubId: body.githubId,
      fullName: body.fullName,
      description: body.description ?? null,
      language: body.language ?? null,
      stars: body.stars ?? 0,
      forks: body.forks ?? 0,
      openIssues: body.openIssues ?? 0,
      htmlUrl: body.htmlUrl,
      ownerLogin: body.ownerLogin ?? "",
      ownerAvatarUrl: body.ownerAvatarUrl ?? "",
      pushedAt: body.pushedAt ?? null,
    });

    return Response.json({ repository: saved }, { status: 201 });
  } catch (err: unknown) {
    // Mongoose duplicate key error (code 11000) — belt-and-suspenders guard
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return Response.json(
        { error: "Repository is already saved." },
        { status: 409 }
      );
    }
    console.error("[POST /api/saved] Error:", err);
    return Response.json(
      { error: "Failed to save repository." },
      { status: 500 }
    );
  }
}
