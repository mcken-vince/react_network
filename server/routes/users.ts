import express from "express";
import { User } from "../models";
import { authenticateToken } from "../middleware/auth.js";
import { validateProfileUpdate } from "../utils/validation.js";
import type { Response } from "express";
import type { AuthRequest } from "../types";

const router = express.Router();

// Get all users (protected route)
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { includeConnectionStatus } = req.query;
      let users;

      if (includeConnectionStatus === "true") {
        // Use getAllUsers for now since getUsersWithConnectionStatus doesn't exist
        users = await User.getAllUsers();
      } else {
        users = await User.getAllUsers();
      }

      res.json({ users });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get current user (protected route)
router.get(
  "/me",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.userId!);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({ user: user.toJSON() });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get user by ID (protected route)
router.get(
  "/:userId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      const user = await User.findById(parseInt(userId));
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({ user: user.toJSON() });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update user profile (protected route)
router.put(
  "/:userId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({ error: "User ID is required" });
        return;
      }

      // Only allow users to update their own profile
      if (req.userId !== parseInt(userId)) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }

      const { error, data } = validateProfileUpdate(req.body);
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      const user = await User.findById(parseInt(userId));
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Check if username is being changed and if it's already taken
      if (data.username && data.username !== user.username) {
        const existingUser = await User.findByUsername(data.username);
        if (existingUser && existingUser.id !== user.id) {
          res.status(400).json({ error: "Username already exists" });
          return;
        }
      }

      // Update user
      const updatedUser = await User.updateUser(parseInt(userId), data);
      if (!updatedUser) {
        res.status(500).json({ error: "Failed to update user" });
        return;
      }

      res.json({
        message: "Profile updated successfully",
        user: updatedUser.toJSON(),
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
