/**
 * Reactions: which ones exist and how many a user may leave per target.
 * Shared verbatim by server and client.
 *
 * Adding a reaction type: append it here. No migration (the column is a
 * validated STRING, not a Postgres ENUM).
 * Removing one: needs a data migration first — existing rows would no longer
 * validate or render.
 */
export const REACTION_TYPES = [
  "like",
  "love",
  "laugh",
  "wow",
  "sad",
  "angry",
  "celebrate",
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];

export interface ReactionConfigItem {
  emoji: string;
  label: string;
}

export const REACTIONS: Record<ReactionType, ReactionConfigItem> = {
  like: { emoji: "👍", label: "Like" },
  love: { emoji: "❤️", label: "Love" },
  laugh: { emoji: "😂", label: "Haha" },
  wow: { emoji: "😮", label: "Wow" },
  sad: { emoji: "😢", label: "Sad" },
  angry: { emoji: "😡", label: "Angry" },
  celebrate: { emoji: "🎉", label: "Celebrate" },
};

export const REACTION_TARGET_TYPES = ["post", "comment", "message"] as const;

export type ReactionTargetType = (typeof REACTION_TARGET_TYPES)[number];

export type ReactionPolicy = "single" | "multi";

/**
 * How many reactions one user may leave on one target, per feature.
 *  - "single": one at a time; picking another replaces it (Facebook-style).
 *  - "multi":  any number of *distinct* types (Slack-style). The unique index
 *              on (targetType, targetId, userId, type) caps this at
 *              REACTION_TYPES.length per user per target.
 *
 * Flipping a value needs no migration. Going multi → single leaves existing
 * extra rows in place; they still display, and collapse to one the next time
 * that user reacts.
 */
export const REACTION_POLICY: Record<ReactionTargetType, ReactionPolicy> = {
  post: "single",
  comment: "single",
  message: "single",
};

export interface ReactionSummary {
  /** Only non-zero entries. */
  counts: Partial<Record<ReactionType, number>>;
  /** Number of reactions (not reactors — in multi mode one user can count several times). */
  total: number;
  /**
   * The viewer's own reactions, oldest first. Under a "single" policy this has
   * length 0 or 1 (except transiently, right after a multi → single flip).
   * Always empty in socket broadcasts, which are not viewer-specific.
   */
  mine: ReactionType[];
}

export const emptyReactionSummary = (): ReactionSummary => ({
  counts: {},
  total: 0,
  mine: [],
});

export const isReactionType = (value: unknown): value is ReactionType =>
  typeof value === "string" &&
  (REACTION_TYPES as readonly string[]).includes(value);
