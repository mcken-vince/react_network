import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/sequelize.js';

class Message extends Model {
  toJSON() {
    const values = { ...this.get() };
    // Ensure timestamp fields are available as camelCase for frontend
    if (values.created_at) {
      values.createdAt = values.created_at;
    }
    if (values.updated_at) {
      values.updatedAt = values.updated_at;
    }
    if (values.edited_at) {
      values.editedAt = values.edited_at;
    }
    return values;
  }

  /**
   * Check if a user can edit/delete this message
   */
  canModify(userId) {
    return this.senderId === userId;
  }

  /**
   * Edit message content
   */
  async editContent(newContent, transaction) {
    this.content = newContent;
    this.isEdited = true;
    this.editedAt = new Date();
    return this.save({ transaction });
  }
}

Message.init({
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
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sender_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Message content cannot be empty'
      },
      len: {
        args: [1, 5000],
        msg: 'Message content must be between 1 and 5000 characters'
      }
    }
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'file', 'system'),
    allowNull: false,
    defaultValue: 'text',
    field: 'message_type',
    validate: {
      isIn: {
        args: [['text', 'image', 'file', 'system']],
        msg: 'Invalid message type'
      }
    }
  },
  attachmentUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'attachment_url',
    validate: {
      isUrl: {
        msg: 'Attachment URL must be a valid URL'
      }
    }
  },
  replyToId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'reply_to_id',
    references: {
      model: 'messages',
      key: 'id'
    }
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_edited'
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'edited_at'
  }
}, {
  sequelize,
  modelName: 'Message',
  tableName: 'messages',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['conversation_id', 'created_at']
    },
    {
      fields: ['sender_id']
    },
    {
      fields: ['reply_to_id']
    },
    {
      fields: ['conversation_id', 'message_type']
    }
  ]
});

// Static methods for database operations
Message.createMessage = async function(messageData, transaction) {
  // Update conversation's updatedAt timestamp
  const conversation = await sequelize.models.Conversation.findByPk(
    messageData.conversationId,
    { transaction }
  );
  
  if (conversation) {
    await conversation.changed('updated_at', true);
    await conversation.save({ transaction });
  }

  return this.create(messageData, { transaction });
};

Message.getConversationMessages = async function(conversationId, options = {}) {
  const { limit = 50, offset = 0, beforeMessageId = null } = options;

  const whereClause = { conversationId };

  // Cursor-based pagination
  if (beforeMessageId) {
    const beforeMessage = await this.findByPk(beforeMessageId);
    if (beforeMessage) {
      whereClause.createdAt = {
        [sequelize.Sequelize.Op.lt]: beforeMessage.createdAt
      };
    }
  }

  return this.findAll({
    where: whereClause,
    include: [
      {
        model: sequelize.models.User,
        as: 'sender',
        attributes: ['id', 'firstName', 'lastName', 'username']
      },
      {
        model: sequelize.models.Message,
        as: 'replyTo',
        required: false,
        include: [{
          model: sequelize.models.User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'username']
        }]
      }
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset
  });
};

Message.getMessageById = async function(messageId) {
  return this.findByPk(messageId, {
    include: [
      {
        model: sequelize.models.User,
        as: 'sender',
        attributes: ['id', 'firstName', 'lastName', 'username']
      },
      {
        model: sequelize.models.Message,
        as: 'replyTo',
        required: false,
        include: [{
          model: sequelize.models.User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'username']
        }]
      }
    ]
  });
};

Message.updateMessage = async function(messageId, userId, newContent, transaction) {
  const message = await this.findByPk(messageId, { transaction });

  if (!message) {
    throw new Error('Message not found');
  }

  if (!message.canModify(userId)) {
    throw new Error('Unauthorized to edit this message');
  }

  return message.editContent(newContent, transaction);
};

Message.deleteMessage = async function(messageId, userId, transaction) {
  const message = await this.findByPk(messageId, { transaction });

  if (!message) {
    throw new Error('Message not found');
  }

  if (!message.canModify(userId)) {
    throw new Error('Unauthorized to delete this message');
  }

  return message.destroy({ transaction });
};

export default Message;
