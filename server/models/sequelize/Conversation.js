import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/sequelize.js';

class Conversation extends Model {
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
   * Check if a user is a participant in the conversation
   */
  async hasParticipant(userId) {
    const participant = await sequelize.models.ConversationParticipant.findOne({
      where: {
        conversationId: this.id,
        userId: userId,
        isActive: true
      }
    });
    return !!participant;
  }

  /**
   * Get all active participants of the conversation
   */
  async getActiveParticipants() {
    return sequelize.models.ConversationParticipant.findAll({
      where: {
        conversationId: this.id,
        isActive: true
      },
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'username']
      }]
    });
  }

  /**
   * Get the last message in the conversation
   */
  async getLastMessage() {
    return sequelize.models.Message.findOne({
      where: { conversationId: this.id },
      order: [['created_at', 'DESC']],
      include: [{
        model: sequelize.models.User,
        as: 'sender',
        attributes: ['id', 'firstName', 'lastName', 'username']
      }]
    });
  }

  /**
   * Get unread message count for a specific user
   */
  async getUnreadCount(userId) {
    const participant = await sequelize.models.ConversationParticipant.findOne({
      where: {
        conversationId: this.id,
        userId: userId,
        isActive: true
      }
    });

    if (!participant) {
      return 0;
    }

    const whereClause = {
      conversationId: this.id,
      senderId: { [sequelize.Sequelize.Op.ne]: userId }
    };

    if (participant.lastReadAt) {
      whereClause.createdAt = {
        [sequelize.Sequelize.Op.gt]: participant.lastReadAt
      };
    }

    return sequelize.models.Message.count({ where: whereClause });
  }
}

Conversation.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('direct', 'group'),
    allowNull: false,
    defaultValue: 'direct',
    validate: {
      isIn: {
        args: [['direct', 'group']],
        msg: 'Type must be either direct or group'
      }
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: {
        args: [1, 255],
        msg: 'Conversation name must be between 1 and 255 characters'
      }
    }
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Conversation',
  tableName: 'conversations',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['updated_at']
    }
  ]
});

// Static methods for database operations
Conversation.createConversation = async function(conversationData, transaction) {
  return this.create(conversationData, { transaction });
};

Conversation.getConversationById = async function(conversationId, userId) {
  const conversation = await this.findByPk(conversationId, {
    include: [
      {
        model: sequelize.models.ConversationParticipant,
        as: 'participants',
        where: { isActive: true },
        required: false,
        include: [{
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'username']
        }]
      },
      {
        model: sequelize.models.User,
        as: 'creator',
        attributes: ['id', 'firstName', 'lastName', 'username'],
        required: false
      }
    ]
  });

  if (!conversation) {
    return null;
  }

  // Check if user is a participant
  if (userId) {
    const isParticipant = await conversation.hasParticipant(userId);
    if (!isParticipant) {
      return null;
    }
  }

  return conversation;
};

Conversation.getUserConversations = async function(userId, options = {}) {
  const { limit = 50, offset = 0 } = options;

  // Get conversations where user is an active participant
  const conversations = await this.findAll({
    include: [
      {
        model: sequelize.models.ConversationParticipant,
        as: 'participants',
        where: { userId: userId, isActive: true },
        required: true
      },
      {
        model: sequelize.models.ConversationParticipant,
        as: 'allParticipants',
        where: { isActive: true },
        required: false,
        include: [{
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'username']
        }]
      },
      {
        model: sequelize.models.User,
        as: 'creator',
        attributes: ['id', 'firstName', 'lastName', 'username'],
        required: false
      }
    ],
    order: [['updated_at', 'DESC']],
    limit,
    offset,
    distinct: true
  });

  return conversations;
};

/**
 * Find or create a direct conversation between two users
 */
Conversation.findOrCreateDirectConversation = async function(userId1, userId2, transaction) {
  // Find existing direct conversation between these two users
  const existingConversation = await this.findOne({
    where: { type: 'direct' },
    include: [{
      model: sequelize.models.ConversationParticipant,
      as: 'participants',
      where: { isActive: true },
      required: true
    }],
    transaction
  });

  if (existingConversation) {
    const participants = await existingConversation.getActiveParticipants();
    const participantIds = participants.map(p => p.userId).sort();
    const targetIds = [userId1, userId2].sort();

    if (participantIds.length === 2 && 
        participantIds[0] === targetIds[0] && 
        participantIds[1] === targetIds[1]) {
      return { conversation: existingConversation, created: false };
    }
  }

  // Create new direct conversation
  const conversation = await this.create({
    type: 'direct',
    createdBy: userId1
  }, { transaction });

  // Add both users as participants
  await sequelize.models.ConversationParticipant.bulkCreate([
    {
      conversationId: conversation.id,
      userId: userId1,
      isActive: true
    },
    {
      conversationId: conversation.id,
      userId: userId2,
      isActive: true
    }
  ], { transaction });

  return { conversation, created: true };
};

export default Conversation;
