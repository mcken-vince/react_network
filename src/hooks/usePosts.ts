import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { postAPI } from "../lib/api";
import { postKeys } from "../lib/queryKeys";
import type {
  CreatePostData,
  Post,
  PostsResponse,
  UpdatePostData,
} from "../types";

export { postKeys };

const PAGE_SIZE = 20;

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

type QueryClient = ReturnType<typeof useQueryClient>;

const invalidatePosts = (queryClient: QueryClient, userId?: number) => {
  void queryClient.invalidateQueries({ queryKey: postKeys.feed() });
  if (userId !== undefined) {
    void queryClient.invalidateQueries({ queryKey: postKeys.user(userId) });
  }
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostData) =>
      postAPI.createPost(data).then((r) => r.post),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: postKeys.all }),
  });
};

export const useUpdatePost = (userId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { postId: string; data: UpdatePostData }) =>
      postAPI.updatePost(vars.postId, vars.data).then((r) => r.post),
    onSuccess: () => invalidatePosts(queryClient, userId),
  });
};

export const useDeletePost = (userId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => postAPI.deletePost(postId),
    onSuccess: () => invalidatePosts(queryClient, userId),
  });
};
