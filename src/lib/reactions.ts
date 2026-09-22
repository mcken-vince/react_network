import { REACTION_POLICY, REACTION_TYPES } from "@shared/reactions";
import type {
  ReactionSummary,
  ReactionTargetType,
  ReactionType,
} from "../types";

/** Everything the client needs to address a reaction target (API path + cache location). */
export type ReactionTargetRef =
  | { targetType: "post"; postId: string }
  | { targetType: "comment"; postId: string; commentId: string }
  | { targetType: "message"; conversationId: string; messageId: string };

export const targetIdOf = (ref: ReactionTargetRef): string => {
  switch (ref.targetType) {
    case "post":
      return ref.postId;
    case "comment":
      return ref.commentId;
    case "message":
      return ref.messageId;
  }
};

/** What the one-click button leaves when the viewer hasn't reacted. */
export const QUICK_REACTION: ReactionType = "like";

const withoutType = (
  summary: ReactionSummary,
  type: ReactionType,
): ReactionSummary => {
  if (!summary.mine.includes(type)) return summary;
  const counts: ReactionSummary["counts"] = {};
  for (const t of REACTION_TYPES) {
    const n = (summary.counts[t] ?? 0) - (t === type ? 1 : 0);
    if (n > 0) counts[t] = n;
  }
  return {
    counts,
    total: Math.max(0, summary.total - 1),
    mine: summary.mine.filter((t) => t !== type),
  };
};

const withType = (
  summary: ReactionSummary,
  type: ReactionType,
): ReactionSummary => ({
  counts: { ...summary.counts, [type]: (summary.counts[type] ?? 0) + 1 },
  total: summary.total + 1,
  mine: [...summary.mine, type],
});

const clearMine = (summary: ReactionSummary): ReactionSummary =>
  summary.mine.reduce(withoutType, summary);

/**
 * Optimistic result of the viewer toggling `type`. Mirrors the server's
 * Reaction.setReaction / clearReaction for the target's policy:
 *  - already has it → remove it (single: remove everything of theirs)
 *  - doesn't        → add it   (single: replacing whatever they had)
 */
export function applyToggle(
  summary: ReactionSummary,
  type: ReactionType,
  targetType: ReactionTargetType,
): ReactionSummary {
  const single = REACTION_POLICY[targetType] === "single";
  if (summary.mine.includes(type)) {
    return single ? clearMine(summary) : withoutType(summary, type);
  }
  return withType(single ? clearMine(summary) : summary, type);
}

/** Non-zero reactions, most popular first; ties keep REACTION_TYPES order. */
export function rankedReactions(
  summary: ReactionSummary,
): { type: ReactionType; count: number }[] {
  return REACTION_TYPES.map((type) => ({
    type,
    count: summary.counts[type] ?? 0,
  }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
}
