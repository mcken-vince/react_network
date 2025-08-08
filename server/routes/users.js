import express from 'express';
import { getAllUsers, findUserById, findUserByUsername, updateUser } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateProfileUpdate } from '../utils/validation.js';

const router = express.Router();

// Get all users (protected route)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { includeConnectionStatus } = req.query;
    let users;
    
    if (includeConnectionStatus === 'true') {
      // Import here to avoid circular dependency
      const { getUsersWithConnectionStatus } = await import('../models/Connection.js');
      users = await getUsersWithConnectionStatus(req.userId);
    } else {
      users = await getAllUsers();
    }
    
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user (protected route)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID (protected route)
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await findUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile (protected route)
router.put('/:userId', authenticateToken, async (req, res) => {
  try {
    // Only allow users to update their own profile
    if (req.userId !== parseInt(req.params.userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { error, data } = validateProfileUpdate(req.body);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const user = await findUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if username is being changed and if it's already taken
    if (data.username && data.username !== user.username) {
      const existingUser = await findUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }

    // Update user
    const updatedUser = await updateUser(req.params.userId, data);
    
    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser.toJSON() 
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
