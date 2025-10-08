import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createPost,
  getPostById,
  updatePost,
  deletePost,
  getFeedForUser,
  getUserPosts,
  canUserAccessPost
} from '../models/Post.js';
import { validateCreatePost, validateUpdatePost } from '../utils/validation/post.js';

const router = express.Router();

// ============================================================================
// Post CRUD routes
// ============================================================================

/**
 * GET /api/posts/feed
 * Get the authenticated user's feed (posts from self and friends)
 */
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    if (limit > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100' });
    }

    const posts = await getFeedForUser(userId, { limit, offset });
    
    res.json({ 
      posts: posts.map(post => post.toJSON()),
      pagination: {
        limit,
        offset,
        count: posts.length
      }
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/posts/user/:userId
 * Get posts by a specific user (with visibility filtering based on relationship)
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const requestingUserId = req.userId;
    const targetUserId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (limit > 100) {
      return res.status(400).json({ error: 'Limit cannot exceed 100' });
    }

    const posts = await getUserPosts(targetUserId, requestingUserId, { limit, offset });
    
    res.json({ 
      posts: posts.map(post => post.toJSON()),
      pagination: {
        limit,
        offset,
        count: posts.length
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/posts/:postId
 * Get a specific post by ID
 */
router.get('/:postId', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;

    // Check if user can access this post
    const canAccess = await canUserAccessPost(postId, userId);
    
    if (!canAccess) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = await getPostById(postId);
    res.json({ post: post.toJSON() });
  } catch (error) {
    console.error('Get post error:', error);
    if (error.message === 'Post not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/posts
 * Create a new post
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { content, imageUrl, visibility } = req.body;

    // Validate input
    const validation = validateCreatePost({ content, imageUrl, visibility });
    if (validation.error) {
      return res.status(400).json(validation.error);
    }

    // Create post
    const postData = {
      userId,
      content,
      imageUrl: imageUrl || null,
      visibility: visibility || 'friends'
    };

    const post = await createPost(postData);
    
    res.status(201).json({ 
      message: 'Post created successfully',
      post: post.toJSON()
    });
  } catch (error) {
    console.error('Create post error:', error);
    
    // Handle validation errors from Sequelize
    if (error.name === 'SequelizeValidationError') {
      const errors = {};
      error.errors.forEach(err => {
        errors[err.path] = err.message;
      });
      return res.status(400).json({ 
        error: { message: 'Validation failed', errors }
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/posts/:postId
 * Update a post (only by author)
 */
router.put('/:postId', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;
    const { content, imageUrl, visibility } = req.body;

    // Validate input
    const validation = validateUpdatePost({ content, imageUrl, visibility });
    if (validation.error) {
      return res.status(400).json(validation.error);
    }

    const updateData = {};
    if (content !== undefined) updateData.content = content;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (visibility !== undefined) updateData.visibility = visibility;

    const post = await updatePost(postId, userId, updateData);
    
    res.json({ 
      message: 'Post updated successfully',
      post: post.toJSON()
    });
  } catch (error) {
    console.error('Update post error:', error);
    
    if (error.message === 'Post not found') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message === 'Not authorized to update this post') {
      return res.status(403).json({ error: error.message });
    }
    
    // Handle validation errors from Sequelize
    if (error.name === 'SequelizeValidationError') {
      const errors = {};
      error.errors.forEach(err => {
        errors[err.path] = err.message;
      });
      return res.status(400).json({ 
        error: { message: 'Validation failed', errors }
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/posts/:postId
 * Delete a post (only by author)
 */
router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;

    await deletePost(postId, userId);
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    
    if (error.message === 'Post not found') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message === 'Not authorized to delete this post') {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
