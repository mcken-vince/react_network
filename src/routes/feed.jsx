import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import CreatePostForm from "../components/posts/CreatePostForm";
import PostFeed from "../components/posts/PostFeed";
import EditPostModal from "../components/posts/EditPostModal";
import usePostFeed from "../hooks/usePostFeed";

export const Route = createFileRoute("/feed")({
  component: FeedPage,
});

function FeedPage() {
  const { user } = useAuth();
  const {
    posts,
    loading,
    error,
    hasMore,
    fetchFeed,
    loadMore,
    createPost,
    updatePost,
    deletePost,
  } = usePostFeed();

  const [editingPost, setEditingPost] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load feed on mount
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleCreatePost = async (postData) => {
    try {
      await createPost(postData);
    } catch (error) {
      throw error; // Let the form component handle the error
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (updateData) => {
    try {
      await updatePost(editingPost.id, updateData);
      setShowEditModal(false);
      setEditingPost(null);
    } catch (error) {
      throw error; // Let the modal handle the error
    }
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setEditingPost(null);
  };

  const handleDeletePost = async (postId) => {
    try {
      await deletePost(postId);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Feed</h1>
          <p className="mt-1 text-sm text-gray-500">
            See what your friends are sharing
          </p>
        </div>

        {/* Create Post Form */}
        <CreatePostForm onPostCreated={handleCreatePost} currentUser={user} />

        {/* Posts Feed */}
        <PostFeed
          posts={posts}
          loading={loading}
          error={error}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
          currentUserId={user?.id}
        />

        {/* Edit Post Modal */}
        <EditPostModal
          post={editingPost}
          isOpen={showEditModal}
          onClose={handleCloseEdit}
          onSave={handleSaveEdit}
        />
      </div>
    </div>
  );
}
