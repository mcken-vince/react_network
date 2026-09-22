import { Message, PostComment, Reaction } from "../models";
import type { ReactionChange } from "../models/Reaction.model";
import type { ReactionTarget } from "../models/types";
import { BadRequestError, NotFoundError } from "../lib/errors";
import { toWire } from "../lib/serialize";
import { emitToUsers } from "../websocket/io";
import { getVisiblePost } from "./postService";
import { activeParticipantIds, assertParticipant } from "./conversationService";
import { syncReactionNotification } from "./notificationService";
import { LIMITS } from "../../shared/limits";
import type {
  ReactionResponse,
  ReactionSummary,
  ReactionType,
  Reactor,
  ReactorsQuery,
  ReactorsResponse,
} from "../types";

/** A target the caller is allowed to react to, plus who gets notified. */
type ResolvedReactionTarget = ReactionTarget & { ownerId: number };

// ---------------------------------------------------------------------------
// Resolvers — authorization lives here, once per target type
// ---------------------------------------------------------------------------

/** Same rule as viewing the post: 404 if hidden. @throws NotFoundError */
export async function resolvePostTarget(
  postId: string,
  viewerId: number,
): Promise<ResolvedReactionTarget> {
  const post = await getVisiblePost(postId, viewerId);
  return { targetType: "post", targetId: post.id, ownerId: post.userId };
}

/** Anyone who can see the post can react to its comments. @throws NotFoundError */
export async function resolveCommentTarget(
  postId: string,
  commentId: string,
  viewerId: number,
): Promise<ResolvedReactionTarget> {
  await getVisiblePost(postId, viewerId);
  const comment = await PostComment.findOne({
    where: { id: commentId, postId },
    attributes: ["id", "postId", "userId"],
  });
  if (!comment) throw new NotFoundError("Comment not found");
  return {
    targetType: "comment",
    targetId: comment.id,
    postId,
    ownerId: comment.userId,
  };
}

/** Active participants only; system messages can't be reacted to. @throws NotFoundError, ForbiddenError, BadRequestError */
export async function resolveMessageTarget(
  messageId: string,
  viewerId: number,
): Promise<ResolvedReactionTarget> {
  const message = await Message.findByPk(messageId, {
    attributes: ["id", "conversationId", "senderId", "messageType"],
  });
  if (!message) throw new NotFoundError("Message not found");
  await assertParticipant(message.conversationId, viewerId);
  if (message.messageType === "system") {
    throw new BadRequestError("System messages can't be reacted to");
  }
  return {
    targetType: "message",
    targetId: message.id,
    conversationId: message.conversationId,
    ownerId: message.senderId,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** For socket payloads: `mine` is per-viewer, so broadcasts never carry it. */
export const viewerNeutral = (summary: ReactionSummary): ReactionSummary => ({
  ...summary,
  mine: [],
});

async function afterChange(
  target: ResolvedReactionTarget,
  userId: number,
  change: ReactionChange,
): Promise<ReactionResponse> {
  const reactions = await Reaction.summaryFor(
    target.targetType,
    target.targetId,
    userId,
  );
  const changed =
    change.added !== null || change.before.length !== change.after.length;

  if (changed) {
    await syncReactionNotification({
      ownerId: target.ownerId,
      reactorId: userId,
      target,
      before: change.before,
      after: change.after,
      added: change.added,
    });
    if (target.targetType === "message") {
      // Everyone in the chat — including the actor's other tabs.
      emitToUsers(
        await activeParticipantIds(target.conversationId),
        "message:reactions",
        {
          conversationId: target.conversationId,
          messageId: target.targetId,
          counts: reactions.counts,
          total: reactions.total,
          actorId: userId,
          actorReactions: reactions.mine,
        },
      );
    }
  }

  return {
    targetType: target.targetType,
    targetId: target.targetId,
    reactions,
  };
}

/** Add (multi) or set (single) the caller's reaction. Idempotent. */
export async function setReaction(
  target: ResolvedReactionTarget,
  userId: number,
  type: ReactionType,
): Promise<ReactionResponse> {
  const change = await Reaction.setReaction(
    target.targetType,
    target.targetId,
    userId,
    type,
  );
  return afterChange(target, userId, change);
}

/** Remove the caller's reaction (single), or one/all of them (multi). Idempotent. */
export async function clearReaction(
  target: ResolvedReactionTarget,
  userId: number,
  type?: ReactionType,
): Promise<ReactionResponse> {
  const change = await Reaction.clearReaction(
    target.targetType,
    target.targetId,
    userId,
    type,
  );
  return afterChange(target, userId, change);
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Newest first; `nextCursor` pages into older reactions. */
export async function listReactors(
  target: ResolvedReactionTarget,
  query: ReactorsQuery,
): Promise<ReactorsResponse> {
  const limit = Math.min(
    Math.max(query.limit ?? LIMITS.REACTORS_PAGE_DEFAULT, 1),
    LIMITS.PAGE_LIMIT_MAX,
  );
  const rows = await Reaction.listReactors(target.targetType, target.targetId, {
    type: query.type,
    limit,
    beforeId: query.before,
  });
  const last = rows.at(-1);
  return {
    reactors: rows.map((row) => toWire<Reactor>(row)),
    nextCursor: rows.length === limit && last ? last.id : undefined,
  };
}
