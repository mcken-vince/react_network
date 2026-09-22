import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { LIMITS } from "@shared/limits";
import {
  flattenComments,
  useAddComment,
  useComments,
  useDeleteComment,
} from "../../hooks/usePosts";
import { useToggleReaction } from "../../hooks/useReactions";
import type { ReactionTargetRef } from "../../lib/reactions";
import { formatPostDate } from "../../utils/dateUtils";
import { ApiError } from "../../lib/api";
import ReactButton from "../reactions/ReactButton";
import ReactionBar from "../reactions/ReactionBar";
import ReactorsModal from "../reactions/ReactorsModal";
import type { PostComment, ReactionType } from "../../types";

interface PostCommentsProps {
  postId: string;
  postOwnerId: number;
  currentUserId?: number;
}

interface CommentItemProps {
  comment: PostComment;
  postId: string;
  canDelete: boolean;
  isDeleting: boolean;
  onDelete: () => void;
}

function CommentItem({
  comment,
  postId,
  canDelete,
  isDeleting,
  onDelete,
}: CommentItemProps) {
  const [showReactors, setShowReactors] = useState(false);
  const reactionTarget: ReactionTargetRef = {
    targetType: "comment",
    postId,
    commentId: comment.id,
  };
  const toggleReaction = useToggleReaction(reactionTarget);
  const react = (type: ReactionType): void =>
    toggleReaction.mutate({ type, current: comment.reactions });

  return (
    <li className="flex gap-2 group">
      <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
        {comment.author?.firstName[0] ?? "?"}
        {comment.author?.lastName[0] ?? ""}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <div className="flex items-baseline justify-between gap-2">
            {comment.author ? (
              <Link
                to="/profile/$userId"
                params={{ userId: String(comment.author.id) }}
                className="text-sm font-semibold text-gray-900 hover:text-blue-600"
              >
                {comment.author.firstName} {comment.author.lastName}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-gray-900">
                Unknown user
              </span>
            )}
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatPostDate(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <ReactButton
            summary={comment.reactions}
            targetType="comment"
            onToggle={react}
            disabled={toggleReaction.isPending}
            size="sm"
            placement="top"
            align="left"
          />
          <ReactionBar
            summary={comment.reactions}
            onToggle={react}
            onShowReactors={() => setShowReactors(true)}
            disabled={toggleReaction.isPending}
            size="sm"
          />
          {canDelete && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Delete this comment?")) onDelete();
              }}
              disabled={isDeleting}
              className="text-xs text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {showReactors && (
        <ReactorsModal
          target={reactionTarget}
          summary={comment.reactions}
          onClose={() => setShowReactors(false)}
        />
      )}
    </li>
  );
}

export default function PostComments({
  postId,
  postOwnerId,
  currentUserId,
}: PostCommentsProps) {
  const query = useComments(postId);
  const addComment = useAddComment(postId);
  const deleteComment = useDeleteComment(postId);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const comments = flattenComments(query.data);
  const remaining = LIMITS.COMMENT_CONTENT_MAX - draft.length;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || remaining < 0) return;
    setError(null);
    try {
      await addComment.mutateAsync(content);
      setDraft("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.errors?.content ?? err.message)
          : "Failed to add comment",
      );
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {query.hasNextPage && (
        <button
          type="button"
          onClick={() => void query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          className="text-sm text-blue-600 hover:text-blue-700 mb-3 disabled:opacity-50"
        >
          {query.isFetchingNextPage ? "Loading…" : "Load older comments"}
        </button>
      )}

      {query.isLoading ? (
        <p className="text-sm text-gray-500">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet. Be the first!</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              canDelete={
                currentUserId !== undefined &&
                (comment.userId === currentUserId ||
                  postOwnerId === currentUserId)
              }
              isDeleting={deleteComment.isPending}
              onDelete={() => deleteComment.mutate(comment.id)}
            />
          ))}
        </ul>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={LIMITS.COMMENT_CONTENT_MAX + 50}
          />
          <button
            type="submit"
            disabled={addComment.isPending || !draft.trim() || remaining < 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {addComment.isPending ? "Posting…" : "Post"}
          </button>
        </div>
        <div className="flex justify-between mt-1">
          {error ? <p className="text-xs text-red-600">{error}</p> : <span />}
          {remaining < 100 && (
            <span
              className={`text-xs ${remaining < 0 ? "text-red-600" : "text-gray-400"}`}
            >
              {remaining}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
