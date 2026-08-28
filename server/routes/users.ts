import express from "express";
import { Connection, User } from "../models";
import { authenticateToken } from "../middleware/auth.js";
import {
  validateProfileUpdate,
  validatePasswordChange,
} from "../utils/validation.js";
import type { Response } from "express";
import type { AuthRequest } from "../types";
import { Op } from "sequelize";
import { sendValidationError } from "../utils/responses";

const router = express.Router();

// Get all users
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

// Get current user
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

// Change current user's password.
// Registered before "/:userId" so "me" is never treated as an id.
router.put(
  "/me/password",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;

      const { error } = validatePasswordChange({
        currentPassword,
        newPassword,
      });
      if (error) {
        sendValidationError(res, error);
        return;
      }

      // Default scope excludes the password hash; we need it to compare.
      const user = await User.scope("withPassword").findByPk(req.userId!);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const isCurrentValid = await user.comparePassword(currentPassword);
      if (!isCurrentValid) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
      }

      user.password = newPassword; // @BeforeUpdate hook hashes it
      await user.save();

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get user by ID
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

// Update own profile (password changes are NOT accepted here — see /me/password)
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

      if (req.userId !== parseInt(userId)) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }

      const { error, data } = validateProfileUpdate(req.body);
      if (error) {
        sendValidationError(res, error);
        return;
      }

      const user = await User.findById(parseInt(userId));
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (data.username && data.username !== user.username) {
        const existingUser = await User.findByUsername(data.username);
        if (existingUser && existingUser.id !== user.id) {
          res.status(400).json({
            error: "Username already exists",
            errors: { username: "Username already exists" },
          });
          return;
        }
      }

      // User.updateUser strips `password` defensively.
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
