import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { postAPI } from "../lib/api";
import { postKeys } from "../lib/queryKeys";
import type {
  CommentsResponse,
  CreatePostData,
  Post,
  PostComment,
  PostsResponse,
  ReactionSummary,
  UpdatePostData,
} from "../types";

const PAGE_SIZE = 20;
const COMMENT_PAGE_SIZE = 20;

type QueryClient = ReturnType<typeof useQueryClient>;

// ---------------------------------------------------------------------------
// Post lists
// ---------------------------------------------------------------------------

const nextOffset = (last: PostsResponse): number | undefined => {
  const { limit, offset, count } = last.pagination;
  return count === limit ? offset + count : undefined;
};

export const useFeed = () =>
  useInfiniteQuery({
    queryKey: postKeys.feed(),
    queryFn: ({ pageParam }) =>
      postAPI.getFeed({ limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: nextOffset,
  });

export const useUserPosts = (userId: number) =>
  useInfiniteQuery({
    queryKey: postKeys.user(userId),
    queryFn: ({ pageParam }) =>
      postAPI.getUserPosts(userId, { limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: nextOffset,
    enabled: Number.isFinite(userId),
  });

export const flattenPosts = (
  data: InfiniteData<PostsResponse> | undefined,
): Post[] => data?.pages.flatMap((page) => page.posts) ?? [];

export const usePost = (postId: string) =>
  useQuery({
    queryKey: postKeys.detail(postId),
    queryFn: () => postAPI.getPost(postId).then((r) => r.post),
  });

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

/** Apply `updater` to one post wherever it is cached (every list + its detail). */
const patchPost = (
  queryClient: QueryClient,
  postId: string,
  updater: (post: Post) => Post,
): void => {
  queryClient.setQueriesData<InfiniteData<PostsResponse>>(
    { queryKey: postKeys.lists() },
    (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: page.posts.map((p) => (p.id === postId ? updater(p) : p)),
            })),
          }
        : old,
  );
  queryClient.setQueryData<Post>(postKeys.detail(postId), (old) =>
    old ? updater(old) : old,
  );
};

/** Used by useToggleReaction. */
export const setPostReactions = (
  queryClient: QueryClient,
  postId: string,
  reactions: ReactionSummary,
): void => patchPost(queryClient, postId, (p) => ({ ...p, reactions }));

// ---------------------------------------------------------------------------
// Post mutations
// ---------------------------------------------------------------------------

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostData) =>
      postAPI.createPost(data).then((r) => r.post),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: postKeys.all }),
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { postId: string; data: UpdatePostData }) =>
      postAPI.updatePost(vars.postId, vars.data).then((r) => r.post),
    onSuccess: (post) =>
      patchPost(queryClient, post.id, (p) => ({ ...p, ...post })),
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => postAPI.deletePost(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: postKeys.all }),
  });
};

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export const useComments = (postId: string, enabled = true) =>
  useInfiniteQuery({
    queryKey: postKeys.comments(postId),
    queryFn: ({ pageParam }) =>
      postAPI.getComments(postId, {
        limit: COMMENT_PAGE_SIZE,
        beforeCommentId: pageParam ?? undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: CommentsResponse) => last.nextCursor,
    enabled,
  });

/** Oldest-first flat list for rendering (pages arrive newest-first). */
export const flattenComments = (
  data: InfiniteData<CommentsResponse> | undefined,
): PostComment[] =>
  data ? [...data.pages.flatMap((p) => p.comments)].reverse() : [];

const patchComments = (
  queryClient: QueryClient,
  postId: string,
  updater: (comments: PostComment[]) => PostComment[],
  firstPageOnly = false,
): void => {
  queryClient.setQueryData<InfiniteData<CommentsResponse>>(
    postKeys.comments(postId),
    (old) => {
      const [first, ...rest] = old?.pages ?? [];
      if (!old || !first) return old;
      if (firstPageOnly) {
        return {
          ...old,
          pages: [{ ...first, comments: updater(first.comments) }, ...rest],
        };
      }
      return {
        ...old,
        pages: old.pages.map((p) => ({ ...p, comments: updater(p.comments) })),
      };
    },
  );
};

/** Used by useToggleReaction. */
export const setCommentReactions = (
  queryClient: QueryClient,
  postId: string,
  commentId: string,
  reactions: ReactionSummary,
): void =>
  patchComments(queryClient, postId, (comments) =>
    comments.map((c) => (c.id === commentId ? { ...c, reactions } : c)),
  );

export const useAddComment = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      postAPI.addComment(postId, { content }).then((r) => r.comment),
    onSuccess: (comment) => {
      if (queryClient.getQueryData(postKeys.comments(postId))) {
        patchComments(
          queryClient,
          postId,
          (comments) => [comment, ...comments],
          true,
        );
      } else {
        void queryClient.invalidateQueries({
          queryKey: postKeys.comments(postId),
        });
      }
      patchPost(queryClient, postId, (p) => ({
        ...p,
        commentCount: p.commentCount + 1,
      }));
    },
  });
};

export const useDeleteComment = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => postAPI.deleteComment(postId, commentId),
    onSuccess: (_res, commentId) => {
      patchComments(queryClient, postId, (comments) =>
        comments.filter((c) => c.id !== commentId),
      );
      patchPost(queryClient, postId, (p) => ({
        ...p,
        commentCount: Math.max(0, p.commentCount - 1),
      }));
    },
  });
};
