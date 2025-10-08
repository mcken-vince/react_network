import sequelize from '../../config/sequelize.js';
import User from './User.js';
import Connection from './Connection.js';
import Notification from './Notification.js';
import Conversation from './Conversation.js';
import ConversationParticipant from './ConversationParticipant.js';
import Message from './Message.js';
import Post from './Post.js';

// ============================================================================
// Connection associations
// ============================================================================
User.hasMany(Connection, {
  foreignKey: 'requesterId',
  as: 'sentRequests'
});

User.hasMany(Connection, {
  foreignKey: 'recipientId',
  as: 'receivedRequests'
});

Connection.belongsTo(User, {
  foreignKey: 'requesterId',
  as: 'requester'
});

Connection.belongsTo(User, {
  foreignKey: 'recipientId',
  as: 'recipient'
});

// ============================================================================
// Notification associations
// ============================================================================
User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications'
});

User.hasMany(Notification, {
  foreignKey: 'relatedUserId',
  as: 'relatedNotifications'
});

Notification.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Notification.belongsTo(User, {
  foreignKey: 'relatedUserId',
  as: 'relatedUser'
});

// Note: We no longer define direct associations between Notification and Connection
// Instead, we use polymorphic relationships via relatedEntityType and relatedEntityId
// This allows Notification to be associated with any entity type (Connection, Post, Comment, etc.)

// Helper function to get the related entity for a notification
Notification.prototype.getRelatedConnection = async function() {
  if (this.relatedEntityType === 'connection' && this.relatedEntityId) {
    return await Connection.findByPk(this.relatedEntityId);
  }
  return null;
};

Notification.prototype.getRelatedConversation = async function() {
  if (this.relatedEntityType === 'conversation' && this.relatedEntityId) {
    return await Conversation.findByPk(this.relatedEntityId);
  }
  return null;
};

Notification.prototype.getRelatedMessage = async function() {
  if (this.relatedEntityType === 'message' && this.relatedEntityId) {
    return await Message.findByPk(this.relatedEntityId);
  }
  return null;
};

// You can add similar helpers for future entity types:
// Notification.prototype.getRelatedPost = async function() { ... }
// Notification.prototype.getRelatedComment = async function() { ... }

// ============================================================================
// Messaging associations
// ============================================================================

// Conversation associations
Conversation.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

User.hasMany(Conversation, {
  foreignKey: 'createdBy',
  as: 'createdConversations'
});

// Conversation ↔ User through ConversationParticipant (many-to-many)
Conversation.belongsToMany(User, {
  through: ConversationParticipant,
  foreignKey: 'conversationId',
  otherKey: 'userId',
  as: 'participantUsers'
});

User.belongsToMany(Conversation, {
  through: ConversationParticipant,
  foreignKey: 'userId',
  otherKey: 'conversationId',
  as: 'conversations'
});

// ConversationParticipant associations
Conversation.hasMany(ConversationParticipant, {
  foreignKey: 'conversationId',
  as: 'participants'
});

Conversation.hasMany(ConversationParticipant, {
  foreignKey: 'conversationId',
  as: 'allParticipants'
});

ConversationParticipant.belongsTo(Conversation, {
  foreignKey: 'conversationId',
  as: 'conversation'
});

User.hasMany(ConversationParticipant, {
  foreignKey: 'userId',
  as: 'participations'
});

ConversationParticipant.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Message associations
Conversation.hasMany(Message, {
  foreignKey: 'conversationId',
  as: 'messages'
});

Message.belongsTo(Conversation, {
  foreignKey: 'conversationId',
  as: 'conversation'
});

User.hasMany(Message, {
  foreignKey: 'senderId',
  as: 'sentMessages'
});

Message.belongsTo(User, {
  foreignKey: 'senderId',
  as: 'sender'
});

// Message reply associations (self-referential)
Message.belongsTo(Message, {
  foreignKey: 'replyToId',
  as: 'replyTo'
});

Message.hasMany(Message, {
  foreignKey: 'replyToId',
  as: 'replies'
});

// ============================================================================
// Post associations
// ============================================================================
User.hasMany(Post, {
  foreignKey: 'userId',
  as: 'posts'
});

Post.belongsTo(User, {
  foreignKey: 'userId',
  as: 'author'
});

// Sync models with database (only in development)
if (process.env.NODE_ENV === 'development') {
  sequelize.sync({ alter: false })
    .then(() => {
      console.log('Database models synchronized');
    })
    .catch(err => {
      console.error('Error synchronizing models:', err);
    });
}

export { 
  sequelize, 
  User, 
  Connection, 
  Notification,
  Conversation,
  ConversationParticipant,
  Message,
  Post
};
export default sequelize;
