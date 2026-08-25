import { useState } from "react";
import useUserPosts from "../../hooks/useUserPosts";
import PostFeed from "../posts/PostFeed";
import EditPostModal from "../posts/EditPostModal";

/**
 * Posts section for a profile page. The server already filters by the
 * viewer's relationship to the profile owner, so this just renders what
 * comes back.
 * @param {number} userId - Profile owner
 * @param {number} currentUserId - Logged-in user
 * @param {boolean} isOwnProfile
 */
function ProfilePosts({ userId, currentUserId, isOwnProfile }) {
  const { posts, loading, error, hasMore, loadMore, updatePost, deletePost } =
    useUserPosts(userId);
  const [editingPost, setEditingPost] = useState(null);

  const handleSaveEdit = async (updateData) => {
    await updatePost(editingPost.id, updateData);
    setEditingPost(null);
  };

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Posts</h2>

      <PostFeed
        posts={posts}
        loading={loading}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onEdit={setEditingPost}
        onDelete={deletePost}
        currentUserId={currentUserId}
        emptyTitle="No posts yet"
        emptyMessage={
          isOwnProfile
            ? "You haven't posted anything yet. Head to the feed to share something."
            : "Nothing to show here."
        }
      />

      <EditPostModal
        post={editingPost}
        isOpen={editingPost !== null}
        onClose={() => setEditingPost(null)}
        onSave={handleSaveEdit}
      />
    </section>
  );
}

export default ProfilePosts;
