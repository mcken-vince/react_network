import { Post, PostComment, Reaction } from "../models";
import { includeUser } from "../models/includes";
import { ForbiddenError, NotFoundError } from "../lib/errors";
import { toWire } from "../lib/serialize";
import { LIMITS } from "../../shared/limits";
import { emptyReactionSummary } from "../../shared/reactions";
import { notifyPostCommented } from "./notificationService";
import type {
  CommentsQuery,
  CommentsResponse,
  Post as PostDto,
  PostComment as PostCommentDto,
} from "../types";

/** What Sequelize serializes; engagement fields are added by `decoratePosts`. */
type PostBase = Omit<PostDto, "commentCount" | "reactions">;
type CommentBase = Omit<PostCommentDto, "reactions">;

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
  const [comments, reactions] = await Promise.all([
    PostComment.countByPost(ids),
    Reaction.summarize("post", ids, viewerId),
  ]);
  return posts.map((post) => ({
    ...toWire<PostBase>(post),
    commentCount: comments.get(post.id) ?? 0,
    reactions: reactions.get(post.id) ?? emptyReactionSummary(),
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

/** Two queries regardless of page size. */
async function decorateComments(
  comments: PostComment[],
  viewerId: number,
): Promise<PostCommentDto[]> {
  if (comments.length === 0) return [];
  const reactions = await Reaction.summarize(
    "comment",
    comments.map((c) => c.id),
    viewerId,
  );
  return comments.map((comment) => ({
    ...toWire<CommentBase>(comment),
    reactions: reactions.get(comment.id) ?? emptyReactionSummary(),
  }));
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
    comments: await decorateComments(rows, viewerId),
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
  // Brand new: nothing can have reacted yet.
  return { ...toWire<CommentBase>(full), reactions: emptyReactionSummary() };
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
  await comment.destroy(); // AfterDestroy hook removes its reactions
}
