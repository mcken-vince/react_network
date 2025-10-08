import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/sequelize.js';
import { NOTIFICATION_TYPES } from '../../config/notificationTypes.js';

class Notification extends Model {
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

  /**
   * Helper method to get the related entity dynamically
   * This allows us to fetch the associated model based on the polymorphic type
   */
  async getRelatedEntity() {
    if (!this.relatedEntityType || !this.relatedEntityId) {
      return null;
    }

    const modelMap = {
      'connection': 'Connection',
      'conversation': 'Conversation',
      'message': 'Message',
      'post': 'Post',
      'comment': 'Comment',
      'like': 'Like',
      'user': 'User'
    };

    const modelName = modelMap[this.relatedEntityType];
    if (!modelName || !sequelize.models[modelName]) {
      return null;
    }

    const Model = sequelize.models[modelName];
    return await Model.findByPk(this.relatedEntityId);
  }
}

Notification.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: {
        args: [Object.values(NOTIFICATION_TYPES)],
        msg: 'Invalid notification type'
      }
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Title is required'
      }
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Message is required'
      }
    }
  },
  relatedUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'related_user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  relatedEntityType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'related_entity_type',
    comment: 'Type of the related entity (e.g., connection, conversation, message, post, comment, like)',
    validate: {
      isIn: {
        args: [['connection', 'conversation', 'message', 'post', 'comment', 'like', 'user']],
        msg: 'Invalid related entity type'
      }
    }
  },
  relatedEntityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'related_entity_id',
    comment: 'ID of the related entity'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional flexible metadata for future extensibility'
  }
}, {
  sequelize,
  modelName: 'Notification',
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['is_read']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['related_entity_type', 'related_entity_id'],
      name: 'idx_notifications_polymorphic'
    }
  ]
});

// Static methods for database operations
Notification.createNotification = async function(notificationData, transaction) {
  return this.create(notificationData, { transaction });
};

Notification.getUserNotifications = async function(userId, options = {}) {
  const { limit = 50, offset = 0, unreadOnly = false, type = null } = options;
  
  const whereClause = { userId };
  if (unreadOnly) {
    whereClause.isRead = false;
  }
  if (type) {
    whereClause.type = type;
  }

  return this.findAll({
    where: whereClause,
    include: [
      {
        model: sequelize.models.User,
        as: 'relatedUser',
        attributes: ['id', 'firstName', 'lastName', 'username'],
        required: false
      }
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset
  });
};

Notification.markAsRead = async function(notificationId, userId, transaction) {
  const notification = await this.findOne({
    where: {
      id: notificationId,
      userId: userId
    },
    transaction
  });

  if (!notification) {
    throw new Error('Notification not found or not authorized');
  }

  return notification.update({ isRead: true }, { transaction });
};

Notification.markAllAsRead = async function(userId, transaction) {
  return this.update(
    { isRead: true },
    {
      where: {
        userId: userId,
        isRead: false
      },
      transaction
    }
  );
};

Notification.getUnreadCount = async function(userId) {
  return this.count({
    where: {
      userId: userId,
      isRead: false
    }
  });
};

Notification.deleteNotification = async function(notificationId, userId, transaction) {
  const notification = await this.findOne({
    where: {
      id: notificationId,
      userId: userId
    },
    transaction
  });

  if (!notification) {
    throw new Error('Notification not found or not authorized');
  }

  return notification.destroy({ transaction });
};

/**
 * Get notifications by related entity
 * Useful for cleaning up notifications when an entity is deleted
 */
Notification.getByRelatedEntity = async function(entityType, entityId) {
  return this.findAll({
    where: {
      relatedEntityType: entityType,
      relatedEntityId: entityId
    }
  });
};

/**
 * Delete notifications by related entity
 * Useful for cascade deletion when an entity is removed
 */
Notification.deleteByRelatedEntity = async function(entityType, entityId, transaction) {
  return this.destroy({
    where: {
      relatedEntityType: entityType,
      relatedEntityId: entityId
    },
    transaction
  });
};

export default Notification;
