import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../../hooks/useAuth";
import { useDeletePost, usePost, useUpdatePost } from "../../hooks/usePosts";
import { AuthenticatedLayout } from "../../components/layout";
import PostCard from "../../components/posts/PostCard";
import EditPostModal from "../../components/posts/EditPostModal";
import Loading from "../../components/Loading";
import type { UpdatePostData } from "../../types";

export const Route = createFileRoute("/posts/$postId")({
  component: PostRoute,
});

function PostRoute() {
  const { postId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: post, isLoading, error } = usePost(postId);
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <AuthenticatedLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/feed" className="text-sm text-blue-600 hover:text-blue-700">
          ← Back to feed
        </Link>
        <div className="mt-4">
          {isLoading ? (
            <Loading />
          ) : error || !post ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <h2 className="text-lg font-medium text-gray-900">
                Post not found
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                It may have been deleted, or you may not have permission to see
                it.
              </p>
            </div>
          ) : (
            <>
              <PostCard
                post={post}
                currentUserId={user?.id}
                onEdit={() => setIsEditing(true)}
                onDelete={async (id: string) => {
                  await deletePost.mutateAsync(id);
                  void navigate({ to: "/feed" });
                }}
                defaultShowComments
              />
              <EditPostModal
                post={post}
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                onSave={async (data: UpdatePostData) => {
                  await updatePost.mutateAsync({ postId: post.id, data });
                  setIsEditing(false);
                }}
              />
            </>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
