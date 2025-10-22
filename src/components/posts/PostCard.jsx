import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { formatPostDate } from "../../utils/dateUtils";
import PostVisibilityBadge from "./PostVisibilityBadge";

export default function PostCard({ post, currentUserId, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnPost = post.userId === currentUserId;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(post.id);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    onEdit(post);
  };

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {/* Author Avatar */}
          <Link
            to="/profile/$userId"
            params={{ userId: post.author.id.toString() }}
            className="flex-shrink-0"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {post.author.firstName[0]}
              {post.author.lastName[0]}
            </div>
          </Link>

          {/* Author Info */}
          <div className="flex-1 min-w-0">
            <Link
              to="/profile/$userId"
              params={{ userId: post.author.id.toString() }}
              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {post.author.firstName} {post.author.lastName}
            </Link>
            <div className="text-sm text-gray-500">@{post.author.username}</div>
          </div>
        </div>

        {/* Actions Menu */}
        <div className="flex items-center space-x-2">
          <PostVisibilityBadge visibility={post.visibility} />

          {isOwnPost && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Post menu"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <button
                    onClick={handleEdit}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit post
                  </button>
                  <button
                    onClick={handleDelete}
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

      {/* Post Content */}
      <div className="mb-3">
        <p className="text-gray-900 whitespace-pre-wrap break-words">
          {post.content}
        </p>
      </div>

      {/* Post Image (if exists) */}
      {post.imageUrl && (
        <div className="mb-3">
          <img
            src={post.imageUrl}
            alt="Post attachment"
            className="rounded-lg max-w-full h-auto"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Post Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="text-sm text-gray-500">
          {formatPostDate(post.createdAt)}
        </div>

        {/* Action Buttons Placeholder */}
        <div className="flex items-center space-x-4">
          {/* Like button placeholder for future feature */}
          <button
            className="flex items-center space-x-1 text-gray-400 hover:text-blue-600 transition-colors"
            disabled
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="text-sm">Like</span>
          </button>

          {/* Comment button placeholder for future feature */}
          <button
            className="flex items-center space-x-1 text-gray-400 hover:text-blue-600 transition-colors"
            disabled
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-sm">Comment</span>
          </button>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)} />
      )}
    </article>
  );
}
