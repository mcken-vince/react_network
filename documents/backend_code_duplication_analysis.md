# Backend Code Duplication Analysis and Refactoring Recommendations

## Executive Summary

After analyzing the backend codebase of the React Network application, I've identified several duplicated code patterns that could benefit from unified solutions. The refactoring opportunities focus on improving code clarity, maintainability, and following the DRY (Don't Repeat Yourself) principle while maintaining single responsibility.

## Identified Duplication Patterns

### 1. **Error Handling Pattern**

**Current State:**
Every route handler has similar error handling logic with console.error and status code responses.

**Example Pattern Found In:**
- `/server/routes/auth.js` (lines 38-40, 72-74)
- `/server/routes/connections.js` (lines 45-51, 74-79, 104-108, 119-121, etc.)
- `/server/routes/notifications.js` (lines 32-34, 45-47, 63-68, 82-84, 99-104)
- `/server/routes/users.js` (lines 14-16, 28-30, 42-44, 81-83)

**Duplicated Pattern:**
```javascript
} catch (error) {
    console.error('Operation error:', error);
    if (error.message.includes('not found') || error.message.includes('not authorized')) {
        return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
}
```

### 2. **Transaction Management Pattern**

**Current State:**
All model files have similar transaction patterns for write operations.

**Example Pattern Found In:**
- `/server/models/User.js` (lines 26-38, 49-61)
- `/server/models/Connection.js` (lines 8-20, 23-35, 38-50, 109-122)
- `/server/models/Notification.js` (lines 8-20, 33-45, 48-60, 73-85)

**Duplicated Pattern:**
```javascript
const transaction = await sequelize.transaction();
try {
    const result = await SomeModel.someMethod(params, transaction);
    await transaction.commit();
    return result;
} catch (error) {
    await transaction.rollback();
    console.error('Error in operation:', error);
    throw error;
}
```

### 3. **Model Wrapper Pattern**

**Current State:**
All three model files (User.js, Connection.js, Notification.js) follow the same pattern of wrapping Sequelize models with transaction support.

**Duplicated Structure:**
- Import Sequelize model
- Re-export as default
- Wrap each method with transaction handling
- Console.error and re-throw pattern

### 4. **Notification Creation Helper Pattern**

**Current State:**
The notification creation helpers in `/server/models/Notification.js` (lines 88-146) have repetitive user lookup and error handling.

**Duplicated Pattern:**
```javascript
const { User } = await import('./sequelize/index.js');
const user = await User.findByPk(userId);
if (!user) {
    throw new Error('User not found');
}
return createNotification({...});
```

### 5. **JWT Secret Configuration**

**Current State:**
JWT secret configuration is duplicated in:
- `/server/routes/auth.js` (line 10)
- `/server/middleware/auth.js` (line 6)

## Proposed Unified Solutions

### 1. **Async Route Handler Wrapper**

Create a unified error handling wrapper for route handlers:

```javascript
// /server/utils/asyncHandler.js
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error(`Error in ${req.method} ${req.path}:`, error);
    
    if (error.isOperational) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('not authorized')) {
      return res.status(403).json({ error: error.message });
    }
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  });
};
```

### 2. **Transaction Manager Utility**

Create a transaction wrapper utility:

```javascript
// /server/utils/transactionManager.js
import sequelize from '../config/sequelize.js';

export const withTransaction = async (callback, errorMessage = 'Transaction failed') => {
  const transaction = await sequelize.transaction();
  
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    console.error(errorMessage, error);
    throw error;
  }
};
```

### 3. **Base Model Service Class**

Create a base service class for common model operations:

```javascript
// /server/services/BaseService.js
import { withTransaction } from '../utils/transactionManager.js';

export class BaseService {
  constructor(model, modelName) {
    this.model = model;
    this.modelName = modelName;
  }

  async findById(id) {
    try {
      return await this.model.findById(id);
    } catch (error) {
      console.error(`Error finding ${this.modelName} by ID:`, error);
      throw error;
    }
  }

  async create(data) {
    return withTransaction(
      async (transaction) => this.model.create(data, { transaction }),
      `Error creating ${this.modelName}`
    );
  }

  async update(id, data) {
    return withTransaction(
      async (transaction) => this.model.update(id, data, { transaction }),
      `Error updating ${this.modelName}`
    );
  }

  async delete(id) {
    return withTransaction(
      async (transaction) => this.model.destroy({ where: { id }, transaction }),
      `Error deleting ${this.modelName}`
    );
  }
}
```

### 4. **Notification Factory**

Create a notification factory to reduce duplication:

```javascript
// /server/services/NotificationFactory.js
import { User } from '../models/sequelize/index.js';
import { createNotification } from '../models/Notification.js';

export class NotificationFactory {
  static async createConnectionNotification(type, recipientId, actorId, connectionId) {
    const actor = await User.findByPk(actorId);
    if (!actor) {
      throw new Error('Actor user not found');
    }

    const templates = {
      'connection_request': {
        title: 'New Connection Request',
        message: `${actor.firstName} ${actor.lastName} wants to connect with you.`
      },
      'connection_accepted': {
        title: 'Connection Request Accepted',
        message: `${actor.firstName} ${actor.lastName} accepted your connection request.`
      },
      'connection_rejected': {
        title: 'Connection Request Declined',
        message: `${actor.firstName} ${actor.lastName} declined your connection request.`
      }
    };

    const template = templates[type];
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    return createNotification({
      userId: recipientId,
      type,
      title: template.title,
      message: template.message,
      relatedUserId: actorId,
      connectionId,
      isRead: false
    });
  }
}
```

### 5. **Centralized Configuration**

Create a centralized configuration module:

```javascript
// /server/config/app.js
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: '7d'
  },
  database: {
    // database configurations
  },
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  }
};
```

## Implementation Examples

### Example 1: Refactored Route Handler

**Before:**
```javascript
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const pendingRequests = await getPendingRequests(userId);
    res.json({ requests: pendingRequests });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**After:**
```javascript
router.get('/pending', authenticateToken, asyncHandler(async (req, res) => {
  const pendingRequests = await getPendingRequests(req.userId);
  res.json({ requests: pendingRequests });
}));
```

### Example 2: Refactored Model Method

**Before:**
```javascript
export const createUser = async (userData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const user = await SequelizeUser.createUser(userData, transaction);
    await transaction.commit();
    return user;
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating user:', error);
    throw error;
  }
};
```

**After:**
```javascript
export const createUser = async (userData) => {
  return withTransaction(
    (transaction) => SequelizeUser.createUser(userData, transaction),
    'Error creating user'
  );
};
```

## Benefits of These Refactorings

1. **Reduced Code Duplication**: Eliminates repetitive error handling and transaction management code
2. **Improved Maintainability**: Changes to error handling or transaction logic only need to be made in one place
3. **Better Error Consistency**: Standardized error responses across all endpoints
4. **Enhanced Readability**: Route handlers and model methods become more focused on business logic
5. **Easier Testing**: Centralized utilities can be tested independently
6. **Type Safety**: With TypeScript, these utilities could provide better type inference

## Implementation Priority

1. **High Priority**: Async handler wrapper and transaction manager (biggest impact, easiest to implement)
2. **Medium Priority**: Centralized configuration (improves security and maintainability)
3. **Low Priority**: Base service class and notification factory (nice to have, but current implementation works)

## Conclusion

These refactoring suggestions would significantly improve the codebase's maintainability while preserving the current functionality. The proposed solutions follow the single responsibility principle and make the code more DRY without over-engineering. Each utility serves a specific purpose and can be adopted incrementally without requiring a complete rewrite.