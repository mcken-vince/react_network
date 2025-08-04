import express from 'express';
import { getAllUsers, findUserById } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all users (protected route)
router.get('/', authenticateToken, (req, res) => {
  try {
    const users = getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user (protected route)
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.toJSON());
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;