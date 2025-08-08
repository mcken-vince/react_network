import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/sequelize.js';

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
    type: DataTypes.ENUM('connection_request', 'connection_accepted', 'connection_rejected'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['connection_request', 'connection_accepted', 'connection_rejected']],
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
  connectionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'connection_id',
    references: {
      model: 'connections',
      key: 'id'
    }
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read'
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
    }
  ]
});

// Static methods for database operations
Notification.createNotification = async function(notificationData, transaction) {
  return this.create(notificationData, { transaction });
};

Notification.getUserNotifications = async function(userId, options = {}) {
  const { limit = 50, offset = 0, unreadOnly = false } = options;
  
  const whereClause = { userId };
  if (unreadOnly) {
    whereClause.isRead = false;
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

export default Notification;
