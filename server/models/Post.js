import { Post as SequelizePost, User, Connection } from './sequelize/index.js';
import sequelize from '../config/sequelize.js';
import { Op } from 'sequelize';

// Re-export the Sequelize Post model as default
export default SequelizePost;

// ============================================================================
// Post CRUD operations
// ============================================================================

export const createPost = async (postData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const post = await SequelizePost.createPost(postData, transaction);
    await transaction.commit();
    
    // Fetch the post with author information
    return await getPostById(post.id);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating post:', error);
    throw error;
  }
};

export const getPostById = async (postId) => {
  try {
    const post = await SequelizePost.findPostById(postId, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    return post;
  } catch (error) {
    console.error('Error getting post by ID:', error);
    throw error;
  }
};

export const updatePost = async (postId, userId, updateData) => {
  const transaction = await sequelize.transaction();
  
  try {
    // First verify the post exists and belongs to the user
    const post = await SequelizePost.findPostById(postId);
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    if (post.userId !== userId) {
      throw new Error('Not authorized to update this post');
    }
    
    // Only allow updating content, imageUrl, and visibility
    const allowedUpdates = {};
    if (updateData.content !== undefined) allowedUpdates.content = updateData.content;
    if (updateData.imageUrl !== undefined) allowedUpdates.imageUrl = updateData.imageUrl;
    if (updateData.visibility !== undefined) allowedUpdates.visibility = updateData.visibility;
    
    const updatedPost = await SequelizePost.updatePost(postId, allowedUpdates, transaction);
    await transaction.commit();
    
    // Fetch the updated post with author information
    return await getPostById(postId);
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating post:', error);
    throw error;
  }
};

export const deletePost = async (postId, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    // First verify the post exists and belongs to the user
    const post = await SequelizePost.findPostById(postId);
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    if (post.userId !== userId) {
      throw new Error('Not authorized to delete this post');
    }
    
    await SequelizePost.deletePost(postId, transaction);
    await transaction.commit();
    
    return post;
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting post:', error);
    throw error;
  }
};

// ============================================================================
// Feed and timeline operations
// ============================================================================

/**
 * Get the user's feed (posts from self and friends)
 */
export const getFeedForUser = async (userId, options = {}) => {
  try {
    const { limit = 50, offset = 0 } = options;
    
    // Get all accepted connections for the user
    const connections = await Connection.findAll({
      where: {
        [Op.or]: [
          { requesterId: userId },
          { recipientId: userId }
        ],
        status: 'accepted'
      }
    });
    
    // Extract friend IDs
    const friendIds = connections.map(conn => 
      conn.requesterId === userId ? conn.recipientId : conn.requesterId
    );
    
    // Include the user's own ID to see their own posts
    const userIds = [userId, ...friendIds];
    
    // Fetch posts from user and friends
    const posts = await SequelizePost.findAll({
      where: {
        userId: {
          [Op.in]: userIds
        }
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    return posts;
  } catch (error) {
    console.error('Error getting feed for user:', error);
    throw error;
  }
};

/**
 * Get posts by a specific user (with visibility filtering)
 */
export const getUserPosts = async (userId, requestingUserId, options = {}) => {
  try {
    const { limit = 50, offset = 0 } = options;
    
    // Determine visibility based on relationship
    let visibilityFilter;
    
    if (userId === requestingUserId) {
      // User viewing their own posts - see all posts
      visibilityFilter = {
        userId
      };
    } else {
      // Check if they are friends
      const connection = await Connection.findOne({
        where: {
          [Op.or]: [
            { requesterId: requestingUserId, recipientId: userId },
            { requesterId: userId, recipientId: requestingUserId }
          ],
          status: 'accepted'
        }
      });
      
      if (connection) {
        // Friends can see public and friends posts
        visibilityFilter = {
          userId,
          visibility: {
            [Op.in]: ['public', 'friends']
          }
        };
      } else {
        // Non-friends can only see public posts
        visibilityFilter = {
          userId,
          visibility: 'public'
        };
      }
    }
    
    const posts = await SequelizePost.findAll({
      where: visibilityFilter,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    return posts;
  } catch (error) {
    console.error('Error getting user posts:', error);
    throw error;
  }
};

/**
 * Check if a user can access a specific post
 */
export const canUserAccessPost = async (postId, userId) => {
  try {
    const post = await SequelizePost.findPostById(postId);
    
    if (!post) {
      return false;
    }
    
    // User can always access their own posts
    if (post.userId === userId) {
      return true;
    }
    
    // Public posts are accessible to everyone
    if (post.visibility === 'public') {
      return true;
    }
    
    // Private posts are only accessible to the author
    if (post.visibility === 'private') {
      return false;
    }
    
    // Friends posts require a connection
    if (post.visibility === 'friends') {
      const connection = await Connection.findOne({
        where: {
          [Op.or]: [
            { requesterId: userId, recipientId: post.userId },
            { requesterId: post.userId, recipientId: userId }
          ],
          status: 'accepted'
        }
      });
      
      return !!connection;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking post access:', error);
    throw error;
  }
};
