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

const router = express.Router();

// Send a connection request
router.post('/request', authenticateToken, async (req, res, next) => {
  try {
    const requesterId = req.userId;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }

    const connection = await sendConnectionRequest(requesterId, recipientId);
    res.status(201).json({ 
      message: 'Connection request sent successfully',
      connection: connection.toJSON()
    });
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('Cannot send')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

// Accept a connection request
router.put('/:connectionId/accept', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { connectionId } = req.params;

    const connection = await acceptConnectionRequest(connectionId, userId);
    res.json({ 
      message: 'Connection request accepted',
      connection: connection.toJSON()
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('not authorized')) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

// Reject a connection request
router.put('/:connectionId/reject', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { connectionId } = req.params;

    const connection = await rejectConnectionRequest(connectionId, userId);
    res.json({ 
      message: 'Connection request rejected',
      connection: connection.toJSON()
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('not authorized')) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

// Get pending connection requests (incoming)
router.get('/pending', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    const pendingRequests = await getPendingRequests(userId);
    res.json({ requests: pendingRequests });
  } catch (error) {
    next(error);
  }
});

// Get sent connection requests (outgoing)
router.get('/sent', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    const sentRequests = await getSentRequests(userId);
    res.json({ requests: sentRequests });
  } catch (error) {
    next(error);
  }
});

// Get user's connections (accepted)
router.get('/connections', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    const connections = await getUserConnections(userId);
    res.json({ connections });
  } catch (error) {
    next(error);
  }
});

// Check connection status with another user
router.get('/status/:userId', authenticateToken, async (req, res, next) => {
  try {
    const currentUserId = req.userId;
    const { userId } = req.params;

    const connectionStatus = await getConnectionStatus(currentUserId, parseInt(userId));
    res.json({ status: connectionStatus });
  } catch (error) {
    next(error);
  }
});

// Remove/cancel a connection
router.delete('/:connectionId', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { connectionId } = req.params;

    await removeConnection(connectionId, userId);
    res.json({ message: 'Connection removed successfully' });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('not authorized')) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

export default router;
