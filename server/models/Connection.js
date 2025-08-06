import pool from '../config/database.js';

class Connection {
  constructor({ id, requester_id, recipient_id, status, created_at, updated_at }) {
    this.id = id;
    this.requesterId = requester_id;
    this.recipientId = recipient_id;
    this.status = status;
    this.createdAt = created_at;
    this.updatedAt = updated_at;
  }

  toJSON() {
    return {
      id: this.id,
      requesterId: this.requesterId,
      recipientId: this.recipientId,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Send a connection request
export const sendConnectionRequest = async (requesterId, recipientId) => {
  if (requesterId === recipientId) {
    throw new Error('Cannot send connection request to yourself');
  }

  const client = await pool.connect();
  
  try {
    // Check if connection already exists
    const existingConnection = await client.query(
      'SELECT * FROM connections WHERE (requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1)',
      [requesterId, recipientId]
    );

    if (existingConnection.rows.length > 0) {
      throw new Error('Connection request already exists');
    }

    const result = await client.query(
      `INSERT INTO connections (requester_id, recipient_id, status) 
       VALUES ($1, $2, 'pending') 
       RETURNING *`,
      [requesterId, recipientId]
    );
    
    return new Connection(result.rows[0]);
  } catch (error) {
    console.error('Error sending connection request:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Accept a connection request
export const acceptConnectionRequest = async (connectionId, userId) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `UPDATE connections 
       SET status = 'accepted' 
       WHERE id = $1 AND recipient_id = $2 AND status = 'pending'
       RETURNING *`,
      [connectionId, userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Connection request not found or not authorized');
    }
    
    return new Connection(result.rows[0]);
  } catch (error) {
    console.error('Error accepting connection request:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Reject a connection request
export const rejectConnectionRequest = async (connectionId, userId) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `UPDATE connections 
       SET status = 'rejected' 
       WHERE id = $1 AND recipient_id = $2 AND status = 'pending'
       RETURNING *`,
      [connectionId, userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Connection request not found or not authorized');
    }
    
    return new Connection(result.rows[0]);
  } catch (error) {
    console.error('Error rejecting connection request:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Get pending connection requests for a user (incoming)
export const getPendingRequests = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT c.*, 
              u.first_name, u.last_name, u.username, u.location
       FROM connections c
       JOIN users u ON c.requester_id = u.id
       WHERE c.recipient_id = $1 AND c.status = 'pending'
       ORDER BY c.created_at DESC`,
      [userId]
    );
    
    return result.rows.map(row => ({
      ...new Connection(row).toJSON(),
      requester: {
        id: row.requester_id,
        firstName: row.first_name,
        lastName: row.last_name,
        username: row.username,
        location: row.location
      }
    }));
  } catch (error) {
    console.error('Error getting pending requests:', error);
    throw error;
  }
};

// Get sent connection requests for a user (outgoing)
export const getSentRequests = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT c.*, 
              u.first_name, u.last_name, u.username, u.location
       FROM connections c
       JOIN users u ON c.recipient_id = u.id
       WHERE c.requester_id = $1 AND c.status = 'pending'
       ORDER BY c.created_at DESC`,
      [userId]
    );
    
    return result.rows.map(row => ({
      ...new Connection(row).toJSON(),
      recipient: {
        id: row.recipient_id,
        firstName: row.first_name,
        lastName: row.last_name,
        username: row.username,
        location: row.location
      }
    }));
  } catch (error) {
    console.error('Error getting sent requests:', error);
    throw error;
  }
};

// Get all connections for a user (accepted)
export const getUserConnections = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT c.*, 
              CASE 
                WHEN c.requester_id = $1 THEN r.first_name
                ELSE req.first_name
              END as first_name,
              CASE 
                WHEN c.requester_id = $1 THEN r.last_name
                ELSE req.last_name
              END as last_name,
              CASE 
                WHEN c.requester_id = $1 THEN r.username
                ELSE req.username
              END as username,
              CASE 
                WHEN c.requester_id = $1 THEN r.location
                ELSE req.location
              END as location,
              CASE 
                WHEN c.requester_id = $1 THEN r.id
                ELSE req.id
              END as connected_user_id
       FROM connections c
       JOIN users req ON c.requester_id = req.id
       JOIN users r ON c.recipient_id = r.id
       WHERE (c.requester_id = $1 OR c.recipient_id = $1) AND c.status = 'accepted'
       ORDER BY c.updated_at DESC`,
      [userId]
    );
    
    return result.rows.map(row => ({
      ...new Connection(row).toJSON(),
      connectedUser: {
        id: row.connected_user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        username: row.username,
        location: row.location
      }
    }));
  } catch (error) {
    console.error('Error getting user connections:', error);
    throw error;
  }
};

// Check connection status between two users
export const getConnectionStatus = async (userId1, userId2) => {
  try {
    const result = await pool.query(
      `SELECT * FROM connections 
       WHERE (requester_id = $1 AND recipient_id = $2) 
          OR (requester_id = $2 AND recipient_id = $1)`,
      [userId1, userId2]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const connection = new Connection(result.rows[0]);
    return {
      ...connection.toJSON(),
      isRequester: connection.requesterId === userId1
    };
  } catch (error) {
    console.error('Error checking connection status:', error);
    throw error;
  }
};

// Remove/cancel a connection
export const removeConnection = async (connectionId, userId) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `DELETE FROM connections 
       WHERE id = $1 AND (requester_id = $2 OR recipient_id = $2)
       RETURNING *`,
      [connectionId, userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Connection not found or not authorized');
    }
    
    return new Connection(result.rows[0]);
  } catch (error) {
    console.error('Error removing connection:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default Connection;
