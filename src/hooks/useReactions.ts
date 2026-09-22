import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { LIMITS } from "@shared/limits";
import { reactionAPI } from "../lib/api";
import { reactionKeys } from "../lib/queryKeys";
import {
  applyToggle,
  targetIdOf,
  type ReactionTargetRef,
} from "../lib/reactions";
import { setCommentReactions, setPostReactions } from "./usePosts";
import { setMessageReactions } from "./useMessaging";
import type { ReactionSummary, ReactionType, ReactorsResponse } from "../types";

type QueryClient = ReturnType<typeof useQueryClient>;

/** Write a target's summary into whichever caches hold it. */
function writeSummary(
  queryClient: QueryClient,
  ref: ReactionTargetRef,
  summary: ReactionSummary,
): void {
  switch (ref.targetType) {
    case "post":
      setPostReactions(queryClient, ref.postId, summary);
      return;
    case "comment":
      setCommentReactions(queryClient, ref.postId, ref.commentId, summary);
      return;
    case "message":
      setMessageReactions(
        queryClient,
        ref.conversationId,
        ref.messageId,
        summary,
      );
      return;
  }
}

interface ToggleVars {
  type: ReactionType;
  /** The summary as currently rendered — decides set vs clear and is the rollback point. */
  current: ReactionSummary;
}

/**
 * Toggle one reaction on one target, optimistically. Works for every target
 * and both policies: `applyToggle` mirrors the server's rules.
 */
export function useToggleReaction(ref: ReactionTargetRef) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, current }: ToggleVars) =>
      current.mine.includes(type)
        ? reactionAPI.clear(ref, type)
        : reactionAPI.set(ref, type),
    onMutate: ({ type, current }: ToggleVars) => {
      writeSummary(
        queryClient,
        ref,
        applyToggle(current, type, ref.targetType),
      );
      return { previous: current };
    },
    onError: (_error, _vars, context) => {
      if (context) writeSummary(queryClient, ref, context.previous);
    },
    onSuccess: (res) => writeSummary(queryClient, ref, res.reactions),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: reactionKeys.target(ref.targetType, targetIdOf(ref)),
      });
    },
  });
}

/** "Who reacted", newest first; `type` filters to one reaction. */
export function useReactors(
  ref: ReactionTargetRef,
  type: ReactionType | undefined,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: reactionKeys.reactors(ref.targetType, targetIdOf(ref), type),
    queryFn: ({ pageParam }) =>
      reactionAPI.listReactors(ref, {
        type,
        limit: LIMITS.REACTORS_PAGE_DEFAULT,
        before: pageParam,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last: ReactorsResponse) => last.nextCursor,
    enabled,
  });
}
