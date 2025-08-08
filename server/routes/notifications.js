import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteNotification
} from '../models/Notification.js';

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true'
    };

    const notifications = await getUserNotifications(userId, options);
    
    res.json({ 
      notifications: notifications.map(n => n.toJSON()),
      count: notifications.length
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread notification count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const count = await getUnreadNotificationCount(userId);
    
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { notificationId } = req.params;

    const notification = await markNotificationAsRead(notificationId, userId);
    
    res.json({ 
      message: 'Notification marked as read',
      notification: notification.toJSON()
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    if (error.message.includes('not found') || error.message.includes('not authorized')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    await markAllNotificationsAsRead(userId);
    
    res.json({ 
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete notification
router.delete('/:notificationId', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { notificationId } = req.params;

    await deleteNotification(notificationId, userId);
    
    res.json({ 
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    if (error.message.includes('not found') || error.message.includes('not authorized')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
