import express from 'express';
import jwt from 'jsonwebtoken';
import { findUserByUsername, createUser } from '../models/User.js';
import { validateSignup, validateLogin } from '../utils/validation.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { error, data } = validateSignup(req.body);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Check if username already exists
    const existingUser = findUserByUsername(data.username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create new user
    const user = await createUser(data);
    
    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      message: 'User created successfully',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { error, data } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Find user
    const user = findUserByUsername(data.username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(data.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;