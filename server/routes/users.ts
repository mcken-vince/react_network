import express from "express";
import { Connection, User } from "../models";
import { authenticateToken } from "../middleware/auth.js";
import { validateProfileUpdate } from "../utils/validation.js";
import type { Response } from "express";
import type { AuthRequest } from "../types";
import { Op } from "sequelize";

const router = express.Router();

// Get all users (protected route)
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const users = await User.getAllUsers();
      if (req.query.includeConnectionStatus === "true") {
        const userId = req.userId!;
        const connections = await Connection.findAll({
          where: {
            [Op.or]: [{ requesterId: userId }, { recipientId: userId }],
          },
        });
        const statusByUser = new Map(
          connections.map((c) => [
            c.requesterId === userId ? c.recipientId : c.requesterId,
            { ...c.toJSON(), isRequester: c.requesterId === userId },
          ]),
        );
        res.json({
          users: users.map((u) => ({
            ...u.toJSON(),
            connectionStatus: statusByUser.get(u.id) || null,
          })),
        });
        return;
      }
      res.json({ users });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
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
  },
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
  },
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
  },
);

export default router;
