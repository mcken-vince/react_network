import { useState } from "react";
import {
  flattenPosts,
  useDeletePost,
  useUpdatePost,
  useUserPosts,
} from "../../hooks/usePosts";
import PostFeed from "../posts/PostFeed";
import EditPostModal from "../posts/EditPostModal";
import type { Post, UpdatePostData } from "../../types";

interface ProfilePostsProps {
  userId: number;
  currentUserId: number;
  isOwnProfile: boolean;
}

function ProfilePosts({
  userId,
  currentUserId,
  isOwnProfile,
}: ProfilePostsProps) {
  const query = useUserPosts(userId);
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const posts = flattenPosts(query.data);

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Posts</h2>
      <PostFeed
        posts={posts}
        loading={query.isLoading || query.isFetchingNextPage}
        error={query.error ? (query.error as Error).message : null}
        hasMore={Boolean(query.hasNextPage)}
        onLoadMore={() => query.fetchNextPage()}
        onEdit={setEditingPost}
        onDelete={(postId: string) => deletePost.mutateAsync(postId)}
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
        onSave={async (data: UpdatePostData) => {
          if (!editingPost) return;
          await updatePost.mutateAsync({ postId: editingPost.id, data });
          setEditingPost(null);
        }}
      />
    </section>
  );
}

export default ProfilePosts;
