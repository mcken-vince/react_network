import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import AuthenticatedLayout from "../components/layout/AuthenticatedLayout";
import CreatePostForm from "../components/posts/CreatePostForm";
import PostFeed from "../components/posts/PostFeed";
import EditPostModal from "../components/posts/EditPostModal";
import {
  flattenPosts,
  useCreatePost,
  useDeletePost,
  useFeed,
  useUpdatePost,
} from "../hooks/usePosts";
import type { CreatePostData, Post, UpdatePostData } from "../types";

export const Route = createFileRoute("/feed")({ component: FeedPage });

function FeedPage() {
  const { user } = useAuth();
  const feed = useFeed();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const posts = flattenPosts(feed.data);

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Feed</h1>
            <p className="mt-1 text-sm text-gray-500">
              See what your friends are sharing
            </p>
          </div>

          <CreatePostForm
            currentUser={user}
            onPostCreated={(data: CreatePostData) =>
              createPost.mutateAsync(data)
            }
          />

          <PostFeed
            posts={posts}
            loading={feed.isLoading || feed.isFetchingNextPage}
            error={feed.error ? (feed.error as Error).message : null}
            hasMore={Boolean(feed.hasNextPage)}
            onLoadMore={() => feed.fetchNextPage()}
            onEdit={setEditingPost}
            onDelete={(postId: string) => deletePost.mutateAsync(postId)}
            currentUserId={user?.id}
          />

          <EditPostModal
            post={editingPost}
            isOpen={editingPost !== null}
            onClose={() => setEditingPost(null)}
            onSave={async (data: UpdatePostData) => {
              if (!editingPost) return;
              await updatePost.mutateAsync({ postId: editingPost.id, data });
              setEditingPost(null);
            }}
          />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
