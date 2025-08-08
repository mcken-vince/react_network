import { Connection as SequelizeConnection } from './sequelize/index.js';
import sequelize from '../config/sequelize.js';

// Re-export the Sequelize Connection model as default
export default SequelizeConnection;

// Send a connection request with transaction
export const sendConnectionRequest = async (requesterId, recipientId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const connection = await SequelizeConnection.sendConnectionRequest(requesterId, recipientId, transaction);
    await transaction.commit();
    return connection;
  } catch (error) {
    await transaction.rollback();
    console.error('Error sending connection request:', error);
    throw error;
  }
};

// Accept a connection request with transaction
export const acceptConnectionRequest = async (connectionId, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const connection = await SequelizeConnection.acceptConnectionRequest(connectionId, userId, transaction);
    await transaction.commit();
    return connection;
  } catch (error) {
    await transaction.rollback();
    console.error('Error accepting connection request:', error);
    throw error;
  }
};

// Reject a connection request with transaction
export const rejectConnectionRequest = async (connectionId, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const connection = await SequelizeConnection.rejectConnectionRequest(connectionId, userId, transaction);
    await transaction.commit();
    return connection;
  } catch (error) {
    await transaction.rollback();
    console.error('Error rejecting connection request:', error);
    throw error;
  }
};

// Get pending connection requests for a user (incoming)
export const getPendingRequests = async (userId) => {
  try {
    return await SequelizeConnection.getPendingRequests(userId);
  } catch (error) {
    console.error('Error getting pending requests:', error);
    throw error;
  }
};

// Get sent connection requests for a user (outgoing)
export const getSentRequests = async (userId) => {
  try {
    return await SequelizeConnection.getSentRequests(userId);
  } catch (error) {
    console.error('Error getting sent requests:', error);
    throw error;
  }
};

// Get all connections for a user (accepted)
export const getUserConnections = async (userId) => {
  try {
    const connections = await SequelizeConnection.getUserConnections(userId);
    
    // Transform the data to match the expected format
    return connections.map(conn => {
      const connData = conn.toJSON();
      const connectedUser = connData.requesterId === userId ? connData.recipient : connData.requester;
      
      return {
        ...connData,
        connectedUser: {
          id: connectedUser.id,
          firstName: connectedUser.firstName || connectedUser.first_name,
          lastName: connectedUser.lastName || connectedUser.last_name,
          username: connectedUser.username,
          location: connectedUser.location
        }
      };
    });
  } catch (error) {
    console.error('Error getting user connections:', error);
    throw error;
  }
};

// Check connection status between two users
export const getConnectionStatus = async (userId1, userId2) => {
  try {
    return await SequelizeConnection.getConnectionStatus(userId1, userId2);
  } catch (error) {
    console.error('Error checking connection status:', error);
    throw error;
  }
};

// Remove/cancel a connection with transaction
export const removeConnection = async (connectionId, userId) => {
  const transaction = await sequelize.transaction();
  
  try {
    const connection = await SequelizeConnection.removeConnection(connectionId, userId, transaction);
    await transaction.commit();
    return connection;
  } catch (error) {
    await transaction.rollback();
    console.error('Error removing connection:', error);
    throw error;
  }
};
