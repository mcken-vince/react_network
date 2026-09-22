import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { formatPostDate } from "../../utils/dateUtils";
import { useToggleReaction } from "../../hooks/useReactions";
import type { ReactionTargetRef } from "../../lib/reactions";
import PostVisibilityBadge from "./PostVisibilityBadge";
import PostComments from "./PostComments";
import ReactButton from "../reactions/ReactButton";
import ReactionBar from "../reactions/ReactionBar";
import ReactorsModal from "../reactions/ReactorsModal";
import type { Post, ReactionType } from "../../types";
import { Icon } from "../atoms";

interface PostCardProps {
  post: Post;
  currentUserId?: number;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => Promise<unknown>;
  /** Open the comments panel immediately (used on the post detail page). */
  defaultShowComments?: boolean;
}

export default function PostCard({
  post,
  currentUserId,
  onEdit,
  onDelete,
  defaultShowComments = false,
}: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [showReactors, setShowReactors] = useState(false);

  const reactionTarget: ReactionTargetRef = {
    targetType: "post",
    postId: post.id,
  };
  const toggleReaction = useToggleReaction(reactionTarget);
  const react = (type: ReactionType): void =>
    toggleReaction.mutate({ type, current: post.reactions });

  const isOwnPost = post.userId === currentUserId;
  const author = post.author;
  const authorName = author
    ? `${author.firstName} ${author.lastName}`
    : "Unknown user";
  const initials = author
    ? `${author.firstName[0] ?? ""}${author.lastName[0] ?? ""}`
    : "?";

  const handleDelete = async (): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    try {
      await onDelete(post.id);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleEdit = (): void => {
    setShowMenu(false);
    onEdit(post);
  };

  const avatar = (
    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
      {initials}
    </div>
  );

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {author ? (
            <Link
              to="/profile/$userId"
              params={{ userId: String(author.id) }}
              className="flex-shrink-0"
            >
              {avatar}
            </Link>
          ) : (
            <div className="flex-shrink-0">{avatar}</div>
          )}
          <div className="flex-1 min-w-0">
            {author ? (
              <Link
                to="/profile/$userId"
                params={{ userId: String(author.id) }}
                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {authorName}
              </Link>
            ) : (
              <span className="font-semibold text-gray-900">{authorName}</span>
            )}
            {author && (
              <div className="text-sm text-gray-500">@{author.username}</div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <PostVisibilityBadge visibility={post.visibility} />
          {isOwnPost && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((open) => !open)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Post menu"
              >
                <Icon name="moreVertical" size="medium" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit post
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={isDeleting}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete post"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-gray-900 whitespace-pre-wrap break-words">
          {post.content}
        </p>
      </div>

      {post.imageUrl && (
        <div className="mb-3">
          <img
            src={post.imageUrl}
            alt="Post attachment"
            className="rounded-lg max-w-full h-auto"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Reaction counts */}
      <ReactionBar
        summary={post.reactions}
        onToggle={react}
        onShowReactors={() => setShowReactors(true)}
        disabled={toggleReaction.isPending}
        className="mb-2"
      />

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <Link
          to="/posts/$postId"
          params={{ postId: post.id }}
          className="text-sm text-gray-500 hover:text-blue-600"
        >
          {formatPostDate(post.createdAt)}
        </Link>

        <div className="flex items-center space-x-4">
          <ReactButton
            summary={post.reactions}
            targetType="post"
            onToggle={react}
            disabled={toggleReaction.isPending}
            placement="top"
            align="right"
          />
          <button
            type="button"
            onClick={() => setShowComments((open) => !open)}
            aria-expanded={showComments}
            className={`flex items-center gap-1 transition-colors ${
              showComments
                ? "text-blue-600"
                : "text-gray-400 hover:text-blue-600"
            }`}
          >
            <Icon name="comment" size="medium" />
            <span className="text-sm">
              {post.commentCount > 0 ? post.commentCount : "Comment"}
            </span>
          </button>
        </div>
      </div>

      {showComments && (
        <PostComments
          postId={post.id}
          postOwnerId={post.userId}
          currentUserId={currentUserId}
        />
      )}

      {showReactors && (
        <ReactorsModal
          target={reactionTarget}
          summary={post.reactions}
          onClose={() => setShowReactors(false)}
        />
      )}

      {showMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)} />
      )}
    </article>
  );
}
