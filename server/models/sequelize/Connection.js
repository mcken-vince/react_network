import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/sequelize.js';

class Connection extends Model {
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
}

Connection.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requesterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'requester_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  recipientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'recipient_id',
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending',
    allowNull: false,
    validate: {
      isIn: {
        args: [['pending', 'accepted', 'rejected']],
        msg: 'Status must be one of: pending, accepted, rejected'
      }
    }
  }
}, {
  sequelize,
  modelName: 'Connection',
  tableName: 'connections',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['requester_id']
    },
    {
      fields: ['recipient_id']
    },
    {
      fields: ['status']
    },
    {
      unique: true,
      fields: ['requester_id', 'recipient_id']
    }
  ],
  validate: {
    notSelfConnection() {
      if (this.requesterId === this.recipientId) {
        throw new Error('Cannot send connection request to yourself');
      }
    }
  }
});

// Static methods for database operations
Connection.sendConnectionRequest = async function(requesterId, recipientId, transaction) {
  // Check if connection already exists (in either direction)
  const existingConnection = await this.findOne({
    where: {
      [sequelize.Sequelize.Op.or]: [
        {
          requesterId: requesterId,
          recipientId: recipientId
        },
        {
          requesterId: recipientId,
          recipientId: requesterId
        }
      ]
    },
    transaction
  });

  if (existingConnection) {
    throw new Error('Connection request already exists');
  }

  return this.create({
    requesterId,
    recipientId,
    status: 'pending'
  }, { transaction });
};

Connection.acceptConnectionRequest = async function(connectionId, userId, transaction) {
  const connection = await this.findOne({
    where: {
      id: connectionId,
      recipientId: userId,
      status: 'pending'
    },
    transaction
  });

  if (!connection) {
    throw new Error('Connection request not found or not authorized');
  }

  return connection.update({ status: 'accepted' }, { transaction });
};

Connection.rejectConnectionRequest = async function(connectionId, userId, transaction) {
  const connection = await this.findOne({
    where: {
      id: connectionId,
      recipientId: userId,
      status: 'pending'
    },
    transaction
  });

  if (!connection) {
    throw new Error('Connection request not found or not authorized');
  }

  return connection.update({ status: 'rejected' }, { transaction });
};

Connection.getPendingRequests = async function(userId) {
  return this.findAll({
    where: {
      recipientId: userId,
      status: 'pending'
    },
    include: [{
      model: sequelize.models.User,
      as: 'requester',
      attributes: ['id', 'firstName', 'lastName', 'username', 'location']
    }],
    order: [['created_at', 'DESC']]
  });
};

Connection.getSentRequests = async function(userId) {
  return this.findAll({
    where: {
      requesterId: userId,
      status: 'pending'
    },
    include: [{
      model: sequelize.models.User,
      as: 'recipient',
      attributes: ['id', 'firstName', 'lastName', 'username', 'location']
    }],
    order: [['created_at', 'DESC']]
  });
};

Connection.getUserConnections = async function(userId) {
  return this.findAll({
    where: {
      [sequelize.Sequelize.Op.and]: [
        {
          [sequelize.Sequelize.Op.or]: [
            { requesterId: userId },
            { recipientId: userId }
          ]
        },
        { status: 'accepted' }
      ]
    },
    include: [
      {
        model: sequelize.models.User,
        as: 'requester',
        attributes: ['id', 'firstName', 'lastName', 'username', 'location']
      },
      {
        model: sequelize.models.User,
        as: 'recipient',
        attributes: ['id', 'firstName', 'lastName', 'username', 'location']
      }
    ],
    order: [['updated_at', 'DESC']]
  });
};

Connection.getConnectionStatus = async function(userId1, userId2) {
  const connection = await this.findOne({
    where: {
      [sequelize.Sequelize.Op.or]: [
        {
          requesterId: userId1,
          recipientId: userId2
        },
        {
          requesterId: userId2,
          recipientId: userId1
        }
      ]
    }
  });

  if (!connection) {
    return null;
  }

  return {
    ...connection.toJSON(),
    isRequester: connection.requesterId === userId1
  };
};

Connection.removeConnection = async function(connectionId, userId, transaction) {
  const connection = await this.findOne({
    where: {
      id: connectionId,
      [sequelize.Sequelize.Op.or]: [
        { requesterId: userId },
        { recipientId: userId }
      ]
    },
    transaction
  });

  if (!connection) {
    throw new Error('Connection not found or not authorized');
  }

  await connection.destroy({ transaction });
  return connection;
};

export default Connection;
