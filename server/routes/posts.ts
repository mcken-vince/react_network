import { Router } from "express";
import { Connection, Post } from "../models";
import { authenticateToken } from "../middleware/auth";
import {
  authed,
  intParam,
  pagination,
  queryInt,
  queryString,
  uuidParam,
  validated,
} from "../lib/http";
import {
  addComment,
  decoratePost,
  decoratePosts,
  deleteComment,
  findOwnedPost,
  getVisiblePost,
  likePost,
  listComments,
  loadPostWithAuthor,
  unlikePost,
} from "../services/postService";
import {
  validateComment,
  validateCreatePost,
  validateUpdatePost,
} from "../utils/validation";
import type {
  CommentResponse,
  CommentsResponse,
  PostLikeResponse,
  PostResponse,
  PostsResponse,
  SuccessMessageResponse,
} from "../types";

const router = Router();
router.use(authenticateToken);

const postsResponse = async (
  posts: Post[],
  viewerId: number,
  limit: number,
  offset: number,
): Promise<PostsResponse> => ({
  posts: await decoratePosts(posts, viewerId),
  pagination: { limit, offset, count: posts.length },
});

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

// Own posts (all visibilities) + public/friends posts from accepted connections
router.get(
  "/feed",
  authed(async (req, res) => {
    const { limit, offset } = pagination(req);
    const connectedUserIds = await Connection.getConnectedUserIds(req.userId);
    const posts = await Post.getFeedPosts(req.userId, connectedUserIds, {
      limit,
      offset,
      includeAuthor: true,
    });
    res.json(await postsResponse(posts, req.userId, limit, offset));
  }),
);

// A user's posts, filtered by the caller's relationship to them
router.get(
  "/user/:userId",
  authed(async (req, res) => {
    const targetUserId = intParam(req, "userId");
    const { limit, offset } = pagination(req);
    const visibility = await Post.visibleVisibilitiesFor(
      req.userId,
      targetUserId,
    );
    const posts = await Post.getUserPosts(targetUserId, {
      limit,
      offset,
      includeAuthor: true,
      visibility,
    });
    res.json(await postsResponse(posts, req.userId, limit, offset));
  }),
);

// ---------------------------------------------------------------------------
// Likes
// ---------------------------------------------------------------------------

router.post(
  "/:postId/like",
  authed(async (req, res) => {
    const post = await likePost(uuidParam(req, "postId"), req.userId);
    res.json({ post } satisfies PostLikeResponse);
  }),
);

router.delete(
  "/:postId/like",
  authed(async (req, res) => {
    const post = await unlikePost(uuidParam(req, "postId"), req.userId);
    res.json({ post } satisfies PostLikeResponse);
  }),
);

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

// GET /posts/:id/comments?limit&beforeCommentId — newest first
router.get(
  "/:postId/comments",
  authed(async (req, res) => {
    const result = await listComments(uuidParam(req, "postId"), req.userId, {
      limit: queryInt(req, "limit"),
      beforeCommentId: queryString(req, "beforeCommentId"),
    });
    res.json(result satisfies CommentsResponse);
  }),
);

router.post(
  "/:postId/comments",
  authed(async (req, res) => {
    const { content } = validated(validateComment(req.body));
    const comment = await addComment(
      uuidParam(req, "postId"),
      req.userId,
      content,
    );
    res.status(201).json({ comment } satisfies CommentResponse);
  }),
);

router.delete(
  "/:postId/comments/:commentId",
  authed(async (req, res) => {
    await deleteComment(
      uuidParam(req, "postId"),
      uuidParam(req, "commentId"),
      req.userId,
    );
    res.json({
      message: "Comment deleted successfully",
    } satisfies SuccessMessageResponse);
  }),
);

// ---------------------------------------------------------------------------
// Single post CRUD
// ---------------------------------------------------------------------------

router.get(
  "/:postId",
  authed(async (req, res) => {
    const post = await getVisiblePost(uuidParam(req, "postId"), req.userId);
    res.json({
      post: await decoratePost(post, req.userId),
    } satisfies PostResponse);
  }),
);

router.post(
  "/",
  authed(async (req, res) => {
    const data = validated(validateCreatePost(req.body));
    const created = await Post.createPost({
      userId: req.userId,
      content: data.content,
      imageUrl: data.imageUrl ?? null,
      visibility: data.visibility ?? "friends",
    });
    const post = await loadPostWithAuthor(created.id);
    res.status(201).json({
      message: "Post created successfully",
      post: await decoratePost(post, req.userId),
    } satisfies PostResponse);
  }),
);

router.put(
  "/:postId",
  authed(async (req, res) => {
    const postId = uuidParam(req, "postId");
    const data = validated(validateUpdatePost(req.body));
    await findOwnedPost(postId, req.userId);
    await Post.updatePost(postId, data);
    const post = await loadPostWithAuthor(postId);
    res.json({
      message: "Post updated successfully",
      post: await decoratePost(post, req.userId),
    } satisfies PostResponse);
  }),
);

router.delete(
  "/:postId",
  authed(async (req, res) => {
    const postId = uuidParam(req, "postId");
    await findOwnedPost(postId, req.userId);
    await Post.deletePost(postId);
    res.json({
      message: "Post deleted successfully",
    } satisfies SuccessMessageResponse);
  }),
);

export default router;
