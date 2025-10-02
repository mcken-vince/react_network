// ========================================
// IMPROVED NOTIFICATION SYSTEM EXAMPLES
// ========================================

// 1. FLEXIBLE NOTIFICATION MODEL
// ========================================

// server/models/sequelize/Notification.js (improved)
import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/sequelize.js';

class Notification extends Model {
  toJSON() {
    const values = { ...this.get() };
    // Parse metadata if it's a string
    if (typeof values.metadata === 'string') {
      try {
        values.metadata = JSON.parse(values.metadata);
      } catch (e) {
        // Keep as string if parsing fails
      }
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
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Type is required'
      }
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // Polymorphic references
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'entity_type'
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'entity_id'
  },
  // Actor who triggered the notification
  actorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'actor_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Flexible metadata storage
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read'
  },
  // For grouping similar notifications
  groupKey: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'group_key'
  }
}, {
  sequelize,
  modelName: 'Notification',
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id', 'is_read'] },
    { fields: ['entity_type', 'entity_id'] },
    { fields: ['type'] },
    { fields: ['created_at'] },
    { fields: ['group_key'] }
  ]
});

// 2. NOTIFICATION FACTORY
// ========================================

// server/services/NotificationFactory.js
export class NotificationFactory {
  static templates = {
    // Connection notifications
    connection_request: {
      getTitle: () => 'New Connection Request',
      getMessage: (data) => `${data.actor.firstName} ${data.actor.lastName} wants to connect with you.`,
      getGroupKey: (data) => null, // Don't group connection requests
      getMetadata: (data) => ({
        connectionId: data.entityId
      })
    },
    
    // Post notifications
    post_like: {
      getTitle: () => 'New Like',
      getMessage: (data) => `${data.actor.firstName} liked your post`,
      getGroupKey: (data) => `post_like_${data.entityId}`,
      getMetadata: (data) => ({
        postId: data.entityId,
        postTitle: data.postTitle
      })
    },
    
    post_comment: {
      getTitle: () => 'New Comment',
      getMessage: (data) => `${data.actor.firstName} commented on your post: "${data.commentPreview}"`,
      getGroupKey: (data) => `post_comment_${data.entityId}`,
      getMetadata: (data) => ({
        postId: data.entityId,
        commentId: data.commentId,
        commentText: data.commentText
      })
    },
    
    comment_reply: {
      getTitle: () => 'New Reply',
      getMessage: (data) => `${data.actor.firstName} replied to your comment`,
      getGroupKey: (data) => `comment_reply_${data.entityId}`,
      getMetadata: (data) => ({
        postId: data.postId,
        commentId: data.entityId,
        replyId: data.replyId
      })
    },
    
    mention_post: {
      getTitle: () => 'You were mentioned',
      getMessage: (data) => `${data.actor.firstName} mentioned you in a post`,
      getGroupKey: (data) => null,
      getMetadata: (data) => ({
        postId: data.entityId,
        mentionContext: data.mentionContext
      })
    },
    
    follow_user: {
      getTitle: () => 'New Follower',
      getMessage: (data) => `${data.actor.firstName} ${data.actor.lastName} started following you`,
      getGroupKey: (data) => 'new_followers',
      getMetadata: (data) => ({
        followerId: data.actorId
      })
    }
  };

  static async create(type, data) {
    const template = this.templates[type];
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    // Load actor information if actorId is provided
    if (data.actorId && !data.actor) {
      const { User } = await import('../models/sequelize/index.js');
      data.actor = await User.findByPk(data.actorId);
    }

    return {
      userId: data.recipientId,
      type,
      title: template.getTitle(data),
      message: template.getMessage(data),
      entityType: data.entityType,
      entityId: data.entityId,
      actorId: data.actorId,
      groupKey: template.getGroupKey ? template.getGroupKey(data) : null,
      metadata: template.getMetadata ? template.getMetadata(data) : {},
      isRead: false
    };
  }
}

// 3. NOTIFICATION SERVICE
// ========================================

// server/services/NotificationService.js
import { NotificationFactory } from './NotificationFactory.js';
import { createNotification } from '../models/Notification.js';
import Queue from 'bull';

export class NotificationService {
  constructor() {
    // Initialize notification queue for async processing
    this.queue = new Queue('notifications', {
      redis: {
        port: process.env.REDIS_PORT || 6379,
        host: process.env.REDIS_HOST || 'localhost'
      }
    });

    this.setupQueueProcessor();
  }

  setupQueueProcessor() {
    this.queue.process(async (job) => {
      const { type, data } = job.data;
      
      try {
        // Check if user has this notification type enabled
        const preferences = await this.getUserPreferences(data.recipientId);
        
        if (!this.shouldSendNotification(type, preferences)) {
          return { skipped: true, reason: 'User preference' };
        }

        // Check for duplicate notifications (deduplication)
        if (data.deduplicationKey) {
          const isDuplicate = await this.checkDuplicate(data);
          if (isDuplicate) {
            return { skipped: true, reason: 'Duplicate notification' };
          }
        }

        // Create the notification
        const notificationData = await NotificationFactory.create(type, data);
        const notification = await createNotification(notificationData);

        // Send real-time update
        await this.sendRealTimeUpdate(data.recipientId, notification);

        // Send email if enabled
        if (preferences[type]?.email) {
          await this.sendEmailNotification(notification);
        }

        // Send push notification if enabled
        if (preferences[type]?.push) {
          await this.sendPushNotification(notification);
        }

        return { success: true, notificationId: notification.id };
      } catch (error) {
        console.error('Error processing notification:', error);
        throw error;
      }
    });
  }

  async notify(type, data) {
    // Add to queue for processing
    const job = await this.queue.add({ type, data }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    return job.id;
  }

  async notifyMultiple(type, recipientIds, data) {
    const jobs = recipientIds.map(recipientId => 
      this.queue.add({ type, data: { ...data, recipientId } })
    );

    return Promise.all(jobs);
  }

  async sendRealTimeUpdate(userId, notification) {
    // Send via WebSocket/SSE
    const io = global.io; // Assuming Socket.IO is set up
    if (io) {
      io.to(`user_${userId}`).emit('new_notification', notification);
    }
  }

  async getUserPreferences(userId) {
    // Fetch from database or cache
    // Default preferences if none exist
    return {
      post_like: { inApp: true, email: false, push: true },
      post_comment: { inApp: true, email: true, push: true },
      mention_post: { inApp: true, email: true, push: true },
      // ... other defaults
    };
  }

  shouldSendNotification(type, preferences) {
    const pref = preferences[type];
    return pref && (pref.inApp || pref.email || pref.push);
  }

  async checkDuplicate(data) {
    // Implement deduplication logic
    // Check if similar notification was sent recently
    return false;
  }
}

// 4. NOTIFICATION API USAGE EXAMPLES
// ========================================

// server/routes/posts.js (example usage)
import { NotificationService } from '../services/NotificationService.js';

const notificationService = new NotificationService();

// When someone likes a post
router.post('/:postId/like', authenticateToken, async (req, res) => {
  const { postId } = req.params;
  const likerId = req.userId;

  // ... create like in database ...

  // Send notification to post author
  if (post.authorId !== likerId) {
    await notificationService.notify('post_like', {
      recipientId: post.authorId,
      actorId: likerId,
      entityType: 'post',
      entityId: postId,
      postTitle: post.title
    });
  }
});

// When someone comments on a post
router.post('/:postId/comments', authenticateToken, async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  const commenterId = req.userId;

  // ... create comment in database ...

  // Notify post author
  if (post.authorId !== commenterId) {
    await notificationService.notify('post_comment', {
      recipientId: post.authorId,
      actorId: commenterId,
      entityType: 'post',
      entityId: postId,
      commentId: comment.id,
      commentText: text,
      commentPreview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
    });
  }

  // Check for mentions in comment
  const mentions = extractMentions(text);
  for (const username of mentions) {
    const user = await User.findOne({ where: { username } });
    if (user && user.id !== commenterId) {
      await notificationService.notify('mention_post', {
        recipientId: user.id,
        actorId: commenterId,
        entityType: 'post',
        entityId: postId,
        mentionContext: text.substring(0, 100)
      });
    }
  }
});

// 5. FRONTEND NOTIFICATION COMPONENT (IMPROVED)
// ========================================

// src/components/notifications/NotificationCard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Flex, Text, Stack } from "../atoms";
import { Card } from "../common";
import { useNotifications } from "../../context/NotificationContext";

const NOTIFICATION_CONFIG = {
  connection_request: {
    icon: '🤝',
    color: 'blue-600',
    action: (notification) => `/connections/requests`
  },
  connection_accepted: {
    icon: '✅',
    color: 'green-600',
    action: (notification) => `/profile/${notification.actorId}`
  },
  post_like: {
    icon: '❤️',
    color: 'red-500',
    action: (notification) => `/posts/${notification.entityId}`
  },
  post_comment: {
    icon: '💬',
    color: 'blue-500',
    action: (notification) => `/posts/${notification.entityId}#comment-${notification.metadata?.commentId}`
  },
  mention_post: {
    icon: '@',
    color: 'purple-500',
    action: (notification) => `/posts/${notification.entityId}`
  },
  follow_user: {
    icon: '👤',
    color: 'indigo-500',
    action: (notification) => `/profile/${notification.actorId}`
  }
};

const NotificationCard = ({ notification, grouped = false }) => {
  const navigate = useNavigate();
  const { markAsRead, deleteNotification } = useNotifications();
  const [isActioning, setIsActioning] = useState(false);

  const config = NOTIFICATION_CONFIG[notification.type] || {
    icon: '📧',
    color: 'gray-600',
    action: null
  };

  const handleClick = async () => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to related content
    const actionPath = typeof config.action === 'function' 
      ? config.action(notification) 
      : config.action;
      
    if (actionPath) {
      navigate(actionPath);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setIsActioning(true);
    await deleteNotification(notification.id);
    setIsActioning(false);
  };

  const renderGroupedMessage = () => {
    if (!grouped || !notification.groupCount || notification.groupCount <= 1) {
      return notification.message;
    }

    // Custom grouped messages
    switch (notification.type) {
      case 'post_like':
        return `${notification.actors[0].firstName} and ${notification.groupCount - 1} others liked your post`;
      case 'follow_user':
        return `${notification.actors[0].firstName} and ${notification.groupCount - 1} others started following you`;
      default:
        return notification.message;
    }
  };

  return (
    <Card
      onClick={handleClick}
      className={`cursor-pointer transition-all hover:shadow-md ${
        !notification.isRead ? 'border-l-4 border-blue-500 bg-blue-50' : ''
      }`}
    >
      <Stack spacing="sm">
        <Flex justify="between" align="start">
          <Flex align="center" gap="sm">
            <Text size="lg">{config.icon}</Text>
            <Stack spacing="xs" className="flex-1">
              <Text
                weight={!notification.isRead ? "semibold" : "medium"}
                color={notification.isRead ? "muted" : config.color}
              >
                {notification.title}
              </Text>
              <Text
                size="sm"
                color={notification.isRead ? "muted" : "gray-700"}
              >
                {renderGroupedMessage()}
              </Text>
              
              {/* Show metadata preview if available */}
              {notification.metadata?.postTitle && (
                <Text size="xs" color="muted" className="italic">
                  "{notification.metadata.postTitle}"
                </Text>
              )}
            </Stack>
          </Flex>

          <Flex gap="xs">
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsRead();
                }}
                disabled={isActioning}
                title="Mark as read"
              >
                ✓
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isActioning}
              className="text-red-500 hover:text-red-700"
              title="Delete notification"
            >
              ×
            </Button>
          </Flex>
        </Flex>

        <Flex justify="between" align="center">
          <Text size="xs" color="muted">
            {new Date(notification.createdAt).toLocaleString()}
          </Text>

          {/* Show grouped actor avatars */}
          {grouped && notification.actors && notification.actors.length > 1 && (
            <Flex gap="xs" align="center">
              <Text size="xs" color="muted">
                From:
              </Text>
              <Flex className="-space-x-2">
                {notification.actors.slice(0, 3).map((actor, idx) => (
                  <div
                    key={actor.id}
                    className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center"
                    title={`${actor.firstName} ${actor.lastName}`}
                  >
                    <Text size="xs">{actor.firstName[0]}</Text>
                  </div>
                ))}
                {notification.actors.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center">
                    <Text size="xs" color="white">+{notification.actors.length - 3}</Text>
                  </div>
                )}
              </Flex>
            </Flex>
          )}
        </Flex>
      </Stack>
    </Card>
  );
};

export default NotificationCard;

// 6. REAL-TIME NOTIFICATION CONTEXT
// ========================================

// src/context/NotificationContext.jsx (improved)
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import io from "socket.io-client";
import { notificationAPI } from "../utils/api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [preferences, setPreferences] = useState({});

  // Initialize WebSocket connection
  useEffect(() => {
    if (user?.id) {
      const newSocket = io(process.env.REACT_APP_WS_URL || 'http://localhost:3001', {
        auth: {
          token: localStorage.getItem('auth-token')
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to notification service');
        newSocket.emit('join', `user_${user.id}`);
      });

      newSocket.on('new_notification', (notification) => {
        handleNewNotification(notification);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user?.id]);

  const handleNewNotification = useCallback((notification) => {
    // Add to notifications list
    setNotifications(prev => [notification, ...prev]);
    
    // Update unread count
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }

    // Show browser notification if permitted
    if (preferences[notification.type]?.browserNotification && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/notification-icon.png',
          tag: notification.id
        });
      }
    }

    // Play notification sound if enabled
    if (preferences[notification.type]?.sound) {
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(e => console.error('Error playing notification sound:', e));
    }
  }, [preferences]);

  // ... rest of the context implementation with improved features
};

// 7. NOTIFICATION PREFERENCES UI
// ========================================

// src/components/settings/NotificationPreferences.jsx
import { useState, useEffect } from 'react';
import { Stack, Text, Switch, Button } from '../atoms';
import { Card } from '../common';
import { notificationAPI } from '../../utils/api';

const NOTIFICATION_TYPES = {
  post_like: { label: 'Post Likes', description: 'When someone likes your post' },
  post_comment: { label: 'Post Comments', description: 'When someone comments on your post' },
  comment_reply: { label: 'Comment Replies', description: 'When someone replies to your comment' },
  mention_post: { label: 'Mentions', description: 'When someone mentions you' },
  follow_user: { label: 'New Followers', description: 'When someone follows you' },
  connection_request: { label: 'Connection Requests', description: 'When someone wants to connect' },
  connection_accepted: { label: 'Accepted Connections', description: 'When someone accepts your request' }
};

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const data = await notificationAPI.getPreferences();
      setPreferences(data.preferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (type, channel) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: !prev[type]?.[channel]
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await notificationAPI.updatePreferences(preferences);
      // Show success message
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <Stack spacing="md">
      <Text size="lg" weight="semibold">Notification Preferences</Text>
      
      {Object.entries(NOTIFICATION_TYPES).map(([type, config]) => (
        <Card key={type}>
          <Stack spacing="sm">
            <div>
              <Text weight="medium">{config.label}</Text>
              <Text size="sm" color="muted">{config.description}</Text>
            </div>
            
            <Stack direction="horizontal" spacing="lg">
              <label className="flex items-center space-x-2">
                <Switch
                  checked={preferences[type]?.inApp ?? true}
                  onChange={() => handleToggle(type, 'inApp')}
                />
                <Text size="sm">In-App</Text>
              </label>
              
              <label className="flex items-center space-x-2">
                <Switch
                  checked={preferences[type]?.email ?? false}
                  onChange={() => handleToggle(type, 'email')}
                />
                <Text size="sm">Email</Text>
              </label>
              
              <label className="flex items-center space-x-2">
                <Switch
                  checked={preferences[type]?.push ?? false}
                  onChange={() => handleToggle(type, 'push')}
                />
                <Text size="sm">Push</Text>
              </label>
            </Stack>
          </Stack>
        </Card>
      ))}
      
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </Stack>
  );
};

export default NotificationPreferences;