import sequelize from '../../config/sequelize.js';
import User from './User.js';
import Connection from './Connection.js';
import Notification from './Notification.js';

// Define associations
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

// Notification associations
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

Notification.belongsTo(Connection, {
  foreignKey: 'connectionId',
  as: 'connection'
});

Connection.hasMany(Notification, {
  foreignKey: 'connectionId',
  as: 'notifications'
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

export { sequelize, User, Connection, Notification };
export default sequelize;
