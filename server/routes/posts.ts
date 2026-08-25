import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { Connection, Post, User } from "../models";
import { validateCreatePost, validateUpdatePost } from "../utils/validation.js";
import type { Response } from "express";
import type { AuthRequest } from "../types";

const router = express.Router();

const MAX_LIMIT = 100;

function parsePagination(req: AuthRequest) {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  return { limit, offset };
}

/**
 * GET /api/posts/feed
 * The caller's own posts (all visibilities) plus public/friends posts from
 * their accepted connections.
 */
router.get(
  "/feed",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { limit, offset } = parsePagination(req);

      if (limit > MAX_LIMIT) {
        res.status(400).json({ error: `Limit cannot exceed ${MAX_LIMIT}` });
        return;
      }

      const connectedUserIds = await Connection.getConnectedUserIds(userId);
      const posts = await Post.getFeedPosts(userId, connectedUserIds, {
        limit,
        offset,
        includeAuthor: true,
      });

      res.json({
        posts: posts.map((post) => post.toJSON()),
        pagination: { limit, offset, count: posts.length },
      });
    } catch (error) {
      console.error("Get feed error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/posts/user/:userId
 * Posts by a specific user, filtered by the caller's relationship to them:
 * own profile → everything; connection → public + friends; otherwise → public.
 */
router.get(
  "/user/:userId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const viewerId = req.userId!;
      const targetUserId = parseInt(req.params.userId as string);
      const { limit, offset } = parsePagination(req);

      if (isNaN(targetUserId)) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }
      if (limit > MAX_LIMIT) {
        res.status(400).json({ error: `Limit cannot exceed ${MAX_LIMIT}` });
        return;
      }

      const visibility = await Post.visibleVisibilitiesFor(
        viewerId,
        targetUserId,
      );
      const posts = await Post.getUserPosts(targetUserId, {
        limit,
        offset,
        includeAuthor: true,
        visibility,
      });

      res.json({
        posts: posts.map((post) => post.toJSON()),
        pagination: { limit, offset, count: posts.length },
      });
    } catch (error) {
      console.error("Get user posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /api/posts/:postId
 * A single post, if the caller is allowed to see it (404 otherwise).
 */
router.get(
  "/:postId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { postId } = req.params;

      if (!postId) {
        res.status(400).json({ error: "Post ID is required" });
        return;
      }

      const canAccess = await Post.canUserAccessPost(postId, userId);
      if (!canAccess) {
        res.status(404).json({ error: "Post not found" });
        return;
      }

      const post = await Post.findPostById(postId, {
        include: [
          {
            model: User,
            as: "author",
            attributes: ["id", "firstName", "lastName", "username", "location"],
          },
        ],
      });

      if (!post) {
        res.status(404).json({ error: "Post not found" });
        return;
      }

      res.json({ post: post.toJSON() });
    } catch (error) {
      console.error("Get post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * POST /api/posts
 */
router.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { content, imageUrl, visibility } = req.body;

      const validation = validateCreatePost({ content, imageUrl, visibility });
      if (validation.error) {
        res.status(400).json(validation.error);
        return;
      }

      const post = await Post.createPost({
        userId,
        content,
        imageUrl: imageUrl || null,
        visibility: visibility || "friends",
      });

      res.status(201).json({
        message: "Post created successfully",
        post: post.toJSON(),
      });
    } catch (error: any) {
      console.error("Create post error:", error);
      if (error.name === "SequelizeValidationError") {
        const errors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          errors[err.path] = err.message;
        });
        res
          .status(400)
          .json({ error: { message: "Validation failed", errors } });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * PUT /api/posts/:postId  (author only)
 */
router.put(
  "/:postId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { postId } = req.params;
      const { content, imageUrl, visibility } = req.body;

      if (!postId) {
        res.status(400).json({ error: "Post ID is required" });
        return;
      }

      const validation = validateUpdatePost({ content, imageUrl, visibility });
      if (validation.error) {
        res.status(400).json(validation.error);
        return;
      }

      const existingPost = await Post.findPostById(postId);
      if (!existingPost) {
        res.status(404).json({ error: "Post not found" });
        return;
      }
      if (existingPost.userId !== userId) {
        res.status(403).json({ error: "Not authorized to update this post" });
        return;
      }

      const updateData: Record<string, any> = {};
      if (content !== undefined) updateData.content = content;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (visibility !== undefined) updateData.visibility = visibility;

      const post = await Post.updatePost(postId, updateData);
      if (!post) {
        res.status(500).json({ error: "Failed to update post" });
        return;
      }

      res.json({ message: "Post updated successfully", post: post.toJSON() });
    } catch (error: any) {
      console.error("Update post error:", error);
      if (error.name === "SequelizeValidationError") {
        const errors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          errors[err.path] = err.message;
        });
        res
          .status(400)
          .json({ error: { message: "Validation failed", errors } });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * DELETE /api/posts/:postId  (author only)
 */
router.delete(
  "/:postId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { postId } = req.params;

      if (!postId) {
        res.status(400).json({ error: "Post ID is required" });
        return;
      }

      const existingPost = await Post.findPostById(postId);
      if (!existingPost) {
        res.status(404).json({ error: "Post not found" });
        return;
      }
      if (existingPost.userId !== userId) {
        res.status(403).json({ error: "Not authorized to delete this post" });
        return;
      }

      await Post.deletePost(postId);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

export default router;
