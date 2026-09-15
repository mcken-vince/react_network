import { Post, PostComment, PostLike } from "../models";
import { includeUser } from "../models/includes";
import { ForbiddenError, NotFoundError } from "../lib/errors";
import { toWire } from "../lib/serialize";
import { LIMITS } from "../../shared/limits";
import { notifyPostCommented, notifyPostLiked } from "./notificationService";
import type {
  CommentsQuery,
  CommentsResponse,
  Post as PostDto,
  PostComment as PostCommentDto,
} from "../types";

/** What Sequelize serializes; engagement fields are added by `decoratePosts`. */
type PostBase = Omit<PostDto, "likeCount" | "commentCount" | "likedByMe">;

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/** @throws NotFoundError */
export async function loadPostWithAuthor(postId: string): Promise<Post> {
  const post = await Post.findPostById(postId, {
    include: [includeUser("author")],
  });
  if (!post) throw new NotFoundError("Post not found");
  return post;
}

/** 404 when the viewer may not see the post — never reveal it exists. @throws NotFoundError */
export async function getVisiblePost(
  postId: string,
  viewerId: number,
): Promise<Post> {
  if (!(await Post.canUserAccessPost(postId, viewerId))) {
    throw new NotFoundError("Post not found");
  }
  return loadPostWithAuthor(postId);
}

/** @throws NotFoundError, ForbiddenError */
export async function findOwnedPost(
  postId: string,
  userId: number,
): Promise<Post> {
  const post = await Post.findByPk(postId);
  if (!post) throw new NotFoundError("Post not found");
  if (post.userId !== userId) {
    throw new ForbiddenError("Not authorized to modify this post");
  }
  return post;
}

// ---------------------------------------------------------------------------
// Serialization — three queries regardless of page size
// ---------------------------------------------------------------------------

export async function decoratePosts(
  posts: Post[],
  viewerId: number,
): Promise<PostDto[]> {
  if (posts.length === 0) return [];
  const ids = posts.map((p) => p.id);
  const [likes, comments, liked] = await Promise.all([
    PostLike.countByPost(ids),
    PostComment.countByPost(ids),
    PostLike.likedPostIds(ids, viewerId),
  ]);
  return posts.map((post) => ({
    ...toWire<PostBase>(post),
    likeCount: likes.get(post.id) ?? 0,
    commentCount: comments.get(post.id) ?? 0,
    likedByMe: liked.has(post.id),
  }));
}

export async function decoratePost(
  post: Post,
  viewerId: number,
): Promise<PostDto> {
  const [dto] = await decoratePosts([post], viewerId);
  if (!dto) throw new Error("decoratePosts returned nothing for one post");
  return dto;
}

// ---------------------------------------------------------------------------
// Likes
// ---------------------------------------------------------------------------

/** Idempotent. @throws NotFoundError */
export async function likePost(
  postId: string,
  userId: number,
): Promise<PostDto> {
  const post = await getVisiblePost(postId, userId);
  const [, created] = await PostLike.findOrCreate({
    where: { postId, userId },
  });
  if (created && post.userId !== userId) {
    await notifyPostLiked(post.userId, userId, postId);
  }
  return decoratePost(post, userId);
}

/** Idempotent. @throws NotFoundError */
export async function unlikePost(
  postId: string,
  userId: number,
): Promise<PostDto> {
  const post = await getVisiblePost(postId, userId);
  await PostLike.destroy({ where: { postId, userId } });
  return decoratePost(post, userId);
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

/** Newest-first page; `nextCursor` pages into older comments. @throws NotFoundError */
export async function listComments(
  postId: string,
  viewerId: number,
  query: CommentsQuery = {},
): Promise<CommentsResponse> {
  await getVisiblePost(postId, viewerId);
  const limit = Math.min(
    query.limit ?? LIMITS.PAGE_LIMIT_DEFAULT,
    LIMITS.PAGE_LIMIT_MAX,
  );
  const rows = await PostComment.getPostComments(postId, {
    limit,
    beforeCommentId: query.beforeCommentId ?? null,
  });
  const oldest = rows.at(-1);
  return {
    comments: rows.map((row) => toWire<PostCommentDto>(row)),
    nextCursor: rows.length === limit && oldest ? oldest.id : undefined,
  };
}

/** @throws NotFoundError */
export async function addComment(
  postId: string,
  userId: number,
  content: string,
): Promise<PostCommentDto> {
  const post = await getVisiblePost(postId, userId);
  const created = await PostComment.create({ postId, userId, content });
  const full = (await PostComment.getCommentById(created.id)) ?? created;
  if (post.userId !== userId) {
    await notifyPostCommented(post.userId, userId, postId, created.id, content);
  }
  return toWire<PostCommentDto>(full);
}

/** The comment's author or the post's owner may delete. @throws NotFoundError, ForbiddenError */
export async function deleteComment(
  postId: string,
  commentId: string,
  userId: number,
): Promise<void> {
  const comment = await PostComment.findOne({
    where: { id: commentId, postId },
  });
  if (!comment) throw new NotFoundError("Comment not found");
  if (comment.userId !== userId) {
    const post = await Post.findByPk(postId, { attributes: ["userId"] });
    if (post?.userId !== userId) {
      throw new ForbiddenError("Not authorized to delete this comment");
    }
  }
  await comment.destroy();
}
