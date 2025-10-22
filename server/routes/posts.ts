import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { Post, User } from "../models";
import { validateCreatePost, validateUpdatePost } from "../utils/validation.js";
import type { Response } from "express";
import type { AuthRequest } from "../types";

const router = express.Router();

// ============================================================================
// Post CRUD routes
// ============================================================================

/**
 * GET /api/posts/feed
 * Get the authenticated user's feed (posts from self and friends)
 */
router.get(
  "/feed",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      if (limit > 100) {
        res.status(400).json({ error: "Limit cannot exceed 100" });
        return;
      }

      // For now, get user's own posts. In a real app, you'd get friends' posts too
      const posts = await Post.getFeedPosts([userId], { 
        limit, 
        offset,
        includeAuthor: true 
      });

      res.json({
        posts: posts.map((post: any) => post.toJSON()),
        pagination: {
          limit,
          offset,
          count: posts.length,
        },
      });
    } catch (error) {
      console.error("Get feed error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/posts/user/:userId
 * Get posts by a specific user (with visibility filtering based on relationship)
 */
router.get(
  "/user/:userId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const targetUserId = parseInt(userId);
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      if (isNaN(targetUserId)) {
        res.status(400).json({ error: "Invalid user ID" });
        return;
      }

      if (limit > 100) {
        res.status(400).json({ error: "Limit cannot exceed 100" });
        return;
      }

      const posts = await Post.getUserPosts(targetUserId, { 
        limit, 
        offset,
        includeAuthor: true 
      });

      res.json({
        posts: posts.map((post: any) => post.toJSON()),
        pagination: {
          limit,
          offset,
          count: posts.length,
        },
      });
    } catch (error) {
      console.error("Get user posts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/posts/:postId
 * Get a specific post by ID
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

      // Check if user can access this post
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
    } catch (error: any) {
      console.error("Get post error:", error);
      if (error.message === "Post not found") {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/posts
 * Create a new post
 */
router.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { content, imageUrl, visibility } = req.body;

      // Validate input
      const validation = validateCreatePost({ content, imageUrl, visibility });
      if (validation.error) {
        res.status(400).json(validation.error);
        return;
      }

      // Create post
      const postData = {
        userId,
        content,
        imageUrl: imageUrl || null,
        visibility: visibility || "friends",
      };

      const post = await Post.createPost(postData);

      res.status(201).json({
        message: "Post created successfully",
        post: post.toJSON(),
      });
    } catch (error: any) {
      console.error("Create post error:", error);

      // Handle validation errors from Sequelize
      if (error.name === "SequelizeValidationError") {
        const errors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          errors[err.path] = err.message;
        });
        res.status(400).json({
          error: { message: "Validation failed", errors },
        });
        return;
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * PUT /api/posts/:postId
 * Update a post (only by author)
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

      // Validate input
      const validation = validateUpdatePost({ content, imageUrl, visibility });
      if (validation.error) {
        res.status(400).json(validation.error);
        return;
      }

      // Check if post exists and user owns it
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

      res.json({
        message: "Post updated successfully",
        post: post.toJSON(),
      });
    } catch (error: any) {
      console.error("Update post error:", error);

      // Handle validation errors from Sequelize
      if (error.name === "SequelizeValidationError") {
        const errors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          errors[err.path] = err.message;
        });
        res.status(400).json({
          error: { message: "Validation failed", errors },
        });
        return;
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * DELETE /api/posts/:postId
 * Delete a post (only by author)
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

      // Check if post exists and user owns it
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
    } catch (error: any) {
      console.error("Delete post error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
