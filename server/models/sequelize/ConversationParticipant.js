import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/sequelize.js';

class ConversationParticipant extends Model {
  toJSON() {
    const values = { ...this.get() };
    // Ensure timestamp fields are available as camelCase for frontend
    if (values.created_at) {
      values.createdAt = values.created_at;
    }
    if (values.updated_at) {
      values.updatedAt = values.updated_at;
    }
    if (values.joined_at) {
      values.joinedAt = values.joined_at;
    }
    if (values.last_read_at) {
      values.lastReadAt = values.last_read_at;
    }
    return values;
  }

  /**
   * Mark messages as read up to current time
   */
  async markAsRead(transaction) {
    this.lastReadAt = new Date();
    return this.save({ transaction });
  }
}

ConversationParticipant.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'conversation_id',
    references: {
      model: 'conversations',
      key: 'id'
    }
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
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'joined_at'
  },
  lastReadAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_read_at'
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_admin'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  sequelize,
  modelName: 'ConversationParticipant',
  tableName: 'conversation_participants',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['conversation_id']
    },
    {
      fields: ['user_id', 'is_active']
    },
    {
      fields: ['user_id', 'conversation_id']
    }
  ]
});

// Static methods for database operations
ConversationParticipant.addParticipant = async function(conversationId, userId, isAdmin = false, transaction) {
  return this.create({
    conversationId,
    userId,
    isAdmin,
    isActive: true
  }, { transaction });
};

ConversationParticipant.removeParticipant = async function(conversationId, userId, transaction) {
  const participant = await this.findOne({
    where: {
      conversationId,
      userId
    },
    transaction
  });

  if (!participant) {
    throw new Error('Participant not found');
  }

  // Soft delete by setting isActive to false
  participant.isActive = false;
  return participant.save({ transaction });
};

ConversationParticipant.getParticipant = async function(conversationId, userId) {
  return this.findOne({
    where: {
      conversationId,
      userId,
      isActive: true
    },
    include: [{
      model: sequelize.models.User,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName', 'username']
    }]
  });
};

ConversationParticipant.markConversationAsRead = async function(conversationId, userId, transaction) {
  const participant = await this.findOne({
    where: {
      conversationId,
      userId,
      isActive: true
    },
    transaction
  });

  if (!participant) {
    throw new Error('Participant not found or not active');
  }

  return participant.markAsRead(transaction);
};

export default ConversationParticipant;
