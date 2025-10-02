export const NOTIFICATION_TYPES = {
  // Connection notifications
  CONNECTION_REQUEST: 'connection_request',
  CONNECTION_ACCEPTED: 'connection_accepted',
  CONNECTION_REJECTED: 'connection_rejected',
  
  // Post notifications
  POST_LIKE: 'post_like',
  POST_COMMENT: 'post_comment',
  POST_SHARE: 'post_share',
  
  // User notifications
  USER_MENTION: 'user_mention',
  USER_FOLLOW: 'user_follow',
  
  // System notifications
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  ACCOUNT_UPDATE: 'account_update'
};

// Notification metadata for each type
export const NOTIFICATION_CONFIG = {
  [NOTIFICATION_TYPES.CONNECTION_REQUEST]: {
    icon: '🤝',
    color: 'blue',
    actionable: true,
    category: 'connection'
  },
  [NOTIFICATION_TYPES.POST_LIKE]: {
    icon: '❤️',
    color: 'red',
    actionable: false,
    category: 'engagement'
  },
  [NOTIFICATION_TYPES.POST_COMMENT]: {
    icon: '💬',
    color: 'green',
    actionable: false,
    category: 'engagement'
  },
  [NOTIFICATION_TYPES.POST_SHARE]: {
    icon: '🔄',
    color: 'purple',
    actionable: false,
    category: 'engagement'
  },
  [NOTIFICATION_TYPES.USER_MENTION]: {
    icon: '📣',
    color: 'orange',
    actionable: true,
    category: 'user'
  },
  [NOTIFICATION_TYPES.USER_FOLLOW]: {
    icon: '👤',
    color: 'teal',
    actionable: true,
    category: 'user'
  },
  [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: {
    icon: '📢',
    color: 'gray',
    actionable: false,
    category: 'system'
  },
  [NOTIFICATION_TYPES.ACCOUNT_UPDATE]: {
    icon: '🔧',
    color: 'blue',
    actionable: true,
    category: 'system'
  }
};
