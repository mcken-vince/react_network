import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/sequelize.js';

class Post extends Model {
  toJSON() {
    const values = { ...this.get() };
    // Ensure timestamp fields are available as camelCase for frontend
    if (values.created_at) {
      values.createdAt = values.created_at;
    }
    if (values.updated_at) {
      values.updatedAt = values.updated_at;
    }
    return values;
  }
}

Post.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    validate: {
      notNull: {
        msg: 'User ID is required'
      }
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Post content is required'
      },
      len: {
        args: [1, 2000],
        msg: 'Post content must be between 1 and 2000 characters'
      }
    }
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'image_url',
    validate: {
      isUrl: {
        msg: 'Image URL must be a valid URL'
      },
      len: {
        args: [0, 500],
        msg: 'Image URL must be less than 500 characters'
      }
    }
  },
  visibility: {
    type: DataTypes.ENUM('public', 'friends', 'private'),
    allowNull: false,
    defaultValue: 'friends',
    validate: {
      isIn: {
        args: [['public', 'friends', 'private']],
        msg: 'Visibility must be one of: public, friends, private'
      }
    }
  }
}, {
  sequelize,
  modelName: 'Post',
  tableName: 'posts',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['user_id', 'created_at']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['visibility']
    }
  ]
});

// Database operations as static methods
Post.createPost = async function(postData, transaction) {
  return this.create(postData, { transaction });
};

Post.findPostById = async function(postId, options = {}) {
  return this.findByPk(postId, options);
};

Post.updatePost = async function(postId, updateData, transaction) {
  const post = await this.findByPk(postId);
  if (!post) {
    return null;
  }
  return post.update(updateData, { transaction });
};

Post.deletePost = async function(postId, transaction) {
  const post = await this.findByPk(postId);
  if (!post) {
    return null;
  }
  await post.destroy({ transaction });
  return post;
};

Post.getUserPosts = async function(userId, options = {}) {
  const { limit = 50, offset = 0, order = [['created_at', 'DESC']] } = options;
  
  return this.findAll({
    where: { userId },
    limit,
    offset,
    order,
    ...options
  });
};

Post.getFeedPosts = async function(userIds, options = {}) {
  const { limit = 50, offset = 0, order = [['created_at', 'DESC']] } = options;
  
  return this.findAll({
    where: {
      userId: userIds,
      visibility: ['friends', 'public']
    },
    limit,
    offset,
    order,
    ...options
  });
};

export default Post;
