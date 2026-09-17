import PostCard from "./PostCard";
import Loading from "../Loading";
import type { Post } from "../../types";
import { Icon } from "../atoms";

interface PostFeedProps {
  posts: Post[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => Promise<unknown>;
  currentUserId?: number;
  error?: string | null;
  emptyTitle?: string;
  emptyMessage?: string;
}

export default function PostFeed({
  posts,
  loading,
  hasMore,
  onLoadMore,
  onEdit,
  onDelete,
  currentUserId,
  error,
  emptyTitle = "No posts yet",
  emptyMessage = "Be the first to share something with your friends!",
}: PostFeedProps) {
  if (error) {
    return (
      <div
        className="bg-red-50 border border-red-200 rounded-lg p-4 text-center"
        role="alert"
      >
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loading />
      </div>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <Icon
          name="fileText"
          size="large"
          className="mx-auto h-12 w-12 text-gray-400"
        />
        <h3 className="mt-4 text-lg font-medium text-gray-900">{emptyTitle}</h3>
        <p className="mt-2 text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}

      {hasMore && (
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {loading && posts.length > 0 && (
        <div className="flex justify-center py-4">
          <Loading />
        </div>
      )}
    </div>
  );
}
