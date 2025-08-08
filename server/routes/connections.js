import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getPendingRequests,
  getSentRequests,
  getUserConnections,
  getConnectionStatus,
  removeConnection
} from '../models/Connection.js';
import {
  createConnectionRequestNotification,
  createConnectionAcceptedNotification,
  createConnectionRejectedNotification
} from '../models/Notification.js';

const router = express.Router();

// Send a connection request
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const requesterId = req.userId;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }

    const connection = await sendConnectionRequest(requesterId, recipientId);
    
    // Create notification for the recipient
    try {
      await createConnectionRequestNotification(recipientId, requesterId, connection.id);
    } catch (notificationError) {
      console.error('Error creating connection request notification:', notificationError);
      // Don't fail the request if notification fails
    }
    
    res.status(201).json({ 
      message: 'Connection request sent successfully',
      connection: connection.toJSON()
    });
  } catch (error) {
    console.error('Send connection request error:', error);
    if (error.message.includes('already exists') || error.message.includes('Cannot send')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept a connection request
router.put('/:connectionId/accept', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { connectionId } = req.params;

    const connection = await acceptConnectionRequest(connectionId, userId);
    
    // Create notification for the requester
    try {
      await createConnectionAcceptedNotification(connection.requesterId, userId, connection.id);
    } catch (notificationError) {
      console.error('Error creating connection accepted notification:', notificationError);
      // Don't fail the request if notification fails
    }
    
    res.json({ 
      message: 'Connection request accepted',
      connection: connection.toJSON()
    });
  } catch (error) {
    console.error('Accept connection request error:', error);
    if (error.message.includes('not found') || error.message.includes('not authorized')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject a connection request
router.put('/:connectionId/reject', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { connectionId } = req.params;

    const connection = await rejectConnectionRequest(connectionId, userId);
    
    // Create notification for the requester
    try {
      await createConnectionRejectedNotification(connection.requesterId, userId, connection.id);
    } catch (notificationError) {
      console.error('Error creating connection rejected notification:', notificationError);
      // Don't fail the request if notification fails
    }
    
    res.json({ 
      message: 'Connection request rejected',
      connection: connection.toJSON()
    });
  } catch (error) {
    console.error('Reject connection request error:', error);
    if (error.message.includes('not found') || error.message.includes('not authorized')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending connection requests (incoming)
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

// Get sent connection requests (outgoing)
router.get('/sent', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const sentRequests = await getSentRequests(userId);
    res.json({ requests: sentRequests });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's connections (accepted)
router.get('/connections', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const connections = await getUserConnections(userId);
    res.json({ connections });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check connection status with another user
router.get('/status/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { userId } = req.params;

    const connectionStatus = await getConnectionStatus(currentUserId, parseInt(userId));
    res.json({ status: connectionStatus });
  } catch (error) {
    console.error('Get connection status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove/cancel a connection
router.delete('/:connectionId', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { connectionId } = req.params;

    await removeConnection(connectionId, userId);
    res.json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Remove connection error:', error);
    if (error.message.includes('not found') || error.message.includes('not authorized')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
