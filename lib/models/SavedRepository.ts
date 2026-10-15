/**
 * Mongoose schema and model for saved GitHub repositories.
 *
 * Stores the essential GitHub repository data to MongoDB so that
 * users can manage their favourites list without hitting the GitHub API.
 */

import mongoose, { Document, Model, Schema } from "mongoose";

// ─── TypeScript Interface ────────────────────────────────────────────────────

export interface ISavedRepository {
  /** Unique GitHub repository ID (prevents duplicates) */
  githubId: number;
  /** e.g. "owner/repo-name" */
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  htmlUrl: string;
  ownerLogin: string;
  ownerAvatarUrl: string;
  /** UTC timestamp of the last push to this repo */
  pushedAt: string | null;
  savedAt: Date;
}

export interface ISavedRepositoryDocument extends ISavedRepository, Document {}

// ─── Schema ──────────────────────────────────────────────────────────────────

const savedRepositorySchema = new Schema<ISavedRepositoryDocument>(
  {
    githubId: {
      type: Number,
      required: true,
      unique: true, // Prevents duplicate saved entries at the DB level
      index: true,
    },
    fullName: { type: String, required: true },
    description: { type: String, default: null },
    language: { type: String, default: null },
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    openIssues: { type: Number, default: 0 },
    htmlUrl: { type: String, required: true },
    ownerLogin: { type: String, required: true },
    ownerAvatarUrl: { type: String, required: true },
    pushedAt: { type: String, default: null },
    savedAt: { type: Date, default: Date.now },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
    // Improve JSON serialisation for API responses
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete (ret as { __v?: unknown }).__v;
        return ret;
      },
    },
  }
);

// ─── Model ───────────────────────────────────────────────────────────────────

/**
 * Guard against model re-compilation in Next.js hot-reload / serverless env.
 * Mongoose caches compiled models on the connection; retrieve it if it exists.
 */
const SavedRepository: Model<ISavedRepositoryDocument> =
  (mongoose.models.SavedRepository as Model<ISavedRepositoryDocument>) ||
  mongoose.model<ISavedRepositoryDocument>(
    "SavedRepository",
    savedRepositorySchema
  );

export default SavedRepository;
