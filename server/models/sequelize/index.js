import sequelize from '../../config/sequelize.js';
import User from './User.js';
import Connection from './Connection.js';

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

export { sequelize, User, Connection };
export default sequelize;
