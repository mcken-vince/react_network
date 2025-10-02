# Notification System Migration Plan

## Overview

This document outlines a step-by-step migration plan to upgrade the notification system from its current limited implementation to a flexible, extensible architecture.

## Migration Phases

### Phase 1: Database Schema Evolution (Week 1)

#### 1.1 Create New Migration File

```sql
-- migrations/20240201000001-update-notifications-flexible.js

export default {
  up: async (queryInterface, Sequelize) => {
    // Add new columns without breaking existing functionality
    await queryInterface.addColumn('notifications', 'entity_type', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    await queryInterface.addColumn('notifications', 'entity_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('notifications', 'actor_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    });

    await queryInterface.addColumn('notifications', 'metadata', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {}
    });

    await queryInterface.addColumn('notifications', 'group_key', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add new type column (keeping old ENUM for now)
    await queryInterface.addColumn('notifications', 'type_new', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    // Copy existing type values to new column
    await queryInterface.sequelize.query(`
      UPDATE notifications
      SET type_new = type::text,
          entity_type = CASE
            WHEN connection_id IS NOT NULL THEN 'connection'
            ELSE NULL
          END,
          entity_id = connection_id,
          actor_id = related_user_id
    `);

    // Add new indexes
    await queryInterface.addIndex('notifications', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('notifications', ['actor_id']);
    await queryInterface.addIndex('notifications', ['group_key']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove in reverse order
    await queryInterface.removeColumn('notifications', 'type_new');
    await queryInterface.removeColumn('notifications', 'metadata');
    await queryInterface.removeColumn('notifications', 'group_key');
    await queryInterface.removeColumn('notifications', 'actor_id');
    await queryInterface.removeColumn('notifications', 'entity_id');
    await queryInterface.removeColumn('notifications', 'entity_type');
  }
};
```

#### 1.2 Create Notification Preferences Table

```sql
-- migrations/20240201000002-create-notification-preferences.js

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notification_preferences', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      notification_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      in_app: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      email: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      push: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      browser_notification: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      sound: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Unique constraint
    await queryInterface.addConstraint('notification_preferences', {
      fields: ['user_id', 'notification_type'],
      type: 'unique',
      name: 'unique_user_notification_type'
    });
  }
};
```

### Phase 2: Backend Code Updates (Week 1-2)

#### 2.1 Update Models with Dual Support

```javascript
// Keep existing model working while adding new functionality
// server/models/sequelize/Notification.js

class Notification extends Model {
  // Add compatibility layer
  static async createNotification(data, transaction) {
    // Support both old and new formats
    if (data.type && !data.type_new) {
      data.type_new = data.type;
    }

    return this.create(data, { transaction });
  }

  // Override getter to return type from type_new if available
  get type() {
    return this.getDataValue("type_new") || this.getDataValue("type");
  }
}
```

#### 2.2 Create Service Layer

- Implement NotificationFactory.js
- Implement NotificationService.js
- Add notification queue with Redis/Bull
- Keep existing notification creation methods working

#### 2.3 Update API Routes

```javascript
// Add new endpoints while keeping old ones
router.get("/preferences", authenticateToken, getNotificationPreferences);
router.put("/preferences", authenticateToken, updateNotificationPreferences);
router.get("/grouped", authenticateToken, getGroupedNotifications);
```

### Phase 3: Frontend Updates (Week 2)

#### 3.1 Update Context with Backward Compatibility

```javascript
// Add new features without breaking existing functionality
export const NotificationProvider = ({ children }) => {
  // Keep all existing state and methods

  // Add new features
  const [preferences, setPreferences] = useState({});
  const [socket, setSocket] = useState(null);

  // Enhanced load function that handles both old and new notifications
  const loadNotifications = async (options = {}) => {
    try {
      const response = await notificationAPI.getNotifications(options);

      // Handle both old and new notification formats
      const notifications = response.notifications.map((n) => ({
        ...n,
        // Ensure backward compatibility
        relatedUser: n.actor || n.relatedUser,
        type: n.type_new || n.type,
      }));

      setNotifications(notifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };
};
```

#### 3.2 Create New Components

- Create flexible NotificationCard that handles both old and new types
- Add NotificationPreferences component
- Update NotificationBell with real-time support

### Phase 4: Feature Rollout (Week 3)

#### 4.1 Implement Feature Flags

```javascript
// config/features.js
export const FEATURES = {
  NEW_NOTIFICATION_TYPES: process.env.ENABLE_NEW_NOTIFICATIONS === "true",
  NOTIFICATION_GROUPING: process.env.ENABLE_NOTIFICATION_GROUPING === "true",
  REAL_TIME_NOTIFICATIONS: process.env.ENABLE_REALTIME_NOTIFICATIONS === "true",
};
```

#### 4.2 Gradual Rollout

1. **Stage 1**: Deploy schema changes and backend code (no user impact)
2. **Stage 2**: Enable new notification types for internal testing
3. **Stage 3**: Roll out to 10% of users
4. **Stage 4**: Monitor and increase to 50%
5. **Stage 5**: Full rollout

### Phase 5: Cleanup (Week 4)

#### 5.1 Final Migration

```sql
-- After confirming all notifications have type_new populated

-- Drop old type column
ALTER TABLE notifications DROP COLUMN type CASCADE;

-- Rename type_new to type
ALTER TABLE notifications RENAME COLUMN type_new TO type;

-- Make it required
ALTER TABLE notifications ALTER COLUMN type SET NOT NULL;

-- Remove old columns if no longer needed
ALTER TABLE notifications DROP COLUMN connection_id;
ALTER TABLE notifications DROP COLUMN related_user_id;
```

#### 5.2 Code Cleanup

- Remove compatibility layers
- Remove old notification creation methods
- Update documentation

## Testing Strategy

### 1. Unit Tests

```javascript
// tests/notifications/NotificationFactory.test.js
describe("NotificationFactory", () => {
  it("should create post_like notification correctly", async () => {
    const data = {
      recipientId: 1,
      actorId: 2,
      entityType: "post",
      entityId: 123,
      actor: { firstName: "John", lastName: "Doe" },
    };

    const notification = await NotificationFactory.create("post_like", data);

    expect(notification.type).toBe("post_like");
    expect(notification.title).toBe("New Like");
    expect(notification.message).toContain("John liked your post");
  });
});
```

### 2. Integration Tests

- Test old notification endpoints still work
- Test new notification creation
- Test preference updates
- Test real-time delivery

### 3. Load Testing

- Test notification queue performance
- Test real-time connection scaling
- Test database query performance with new indexes

## Monitoring & Rollback Plan

### Monitoring

1. **Metrics to Track**:
   - Notification delivery time
   - Queue processing time
   - Database query performance
   - Error rates
   - User engagement with notifications

2. **Alerts**:
   - Set up alerts for notification queue backlog
   - Monitor error rates above threshold
   - Track delivery failures

### Rollback Plan

1. **Database**: Keep migrations reversible
2. **Code**: Use feature flags for quick disable
3. **Queue**: Ability to pause/resume processing
4. **Documentation**: Clear rollback procedures

## Risk Mitigation

### Identified Risks

1. **Data Migration Errors**
   - Mitigation: Thorough testing, staged rollout
2. **Performance Degradation**
   - Mitigation: Load testing, monitoring, indexes
3. **Breaking Changes**
   - Mitigation: Backward compatibility, feature flags
4. **User Confusion**
   - Mitigation: Clear UI, user education

### Contingency Plans

- Have database backups before migration
- Ability to quickly revert code changes
- Support team briefed on changes
- User communication plan ready

## Success Criteria

1. **Technical Success**:
   - All existing notifications continue working
   - New notification types functional
   - Performance metrics maintained or improved
   - Zero data loss

2. **User Success**:
   - Increased notification engagement
   - Positive user feedback
   - Reduced notification fatigue
   - Clear preference controls

## Timeline Summary

- **Week 1**: Database changes, backend services
- **Week 2**: Frontend updates, testing
- **Week 3**: Staged rollout, monitoring
- **Week 4**: Cleanup, optimization

Total Duration: 4 weeks from start to complete rollout
