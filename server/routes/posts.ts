import { Router } from "express";
import { Connection, Post } from "../models";
import { includeUser } from "../models/includes";
import { authenticateToken } from "../middleware/auth";
import {
  authed,
  intParam,
  pagination,
  uuidParam,
  validated,
} from "../lib/http";
import { toWire } from "../lib/serialize";
import { ForbiddenError, NotFoundError } from "../lib/errors";
import { validateCreatePost, validateUpdatePost } from "../utils/validation";
import type {
  Post as PostDto,
  PostResponse,
  PostsResponse,
  SuccessMessageResponse,
} from "../types";

const router = Router();
router.use(authenticateToken);

const postsResponse = (
  posts: Post[],
  limit: number,
  offset: number,
): PostsResponse => ({
  posts: posts.map((p) => toWire<PostDto>(p)),
  pagination: { limit, offset, count: posts.length },
});

async function loadPostWithAuthor(postId: string): Promise<Post> {
  const post = await Post.findPostById(postId, {
    include: [includeUser("author")],
  });
  if (!post) throw new NotFoundError("Post not found");
  return post;
}

/** @throws NotFoundError, ForbiddenError */
async function findOwnedPost(postId: string, userId: number): Promise<Post> {
  const post = await Post.findByPk(postId);
  if (!post) throw new NotFoundError("Post not found");
  if (post.userId !== userId)
    throw new ForbiddenError("Not authorized to modify this post");
  return post;
}

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
    res.json(postsResponse(posts, limit, offset));
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
    res.json(postsResponse(posts, limit, offset));
  }),
);

// A single post, 404 if the caller may not see it (don't reveal it exists)
router.get(
  "/:postId",
  authed(async (req, res) => {
    const postId = uuidParam(req, "postId");
    if (!(await Post.canUserAccessPost(postId, req.userId))) {
      throw new NotFoundError("Post not found");
    }
    const post = await loadPostWithAuthor(postId);
    res.json({ post: toWire<PostDto>(post) } satisfies PostResponse);
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
      post: toWire<PostDto>(post),
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
      post: toWire<PostDto>(post),
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
