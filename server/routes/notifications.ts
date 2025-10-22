import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { Notification } from "../models";
import type { Response } from "express";
import type { AuthRequest } from "../types";

const router = express.Router();

// Get user notifications
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!.toString();
      const { limit = 50, offset = 0, unreadOnly = false } = req.query;

      const options = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        unreadOnly: unreadOnly === "true",
      };

      const notifications = await Notification.getUserNotifications(
        userId,
        options
      );

      res.json({
        notifications: notifications.map((n) => n.toJSON()),
        count: notifications.length,
      });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get unread notification count
router.get(
  "/unread-count",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!.toString();
      const count = await Notification.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Mark notification as read
router.put(
  "/:notificationId/read",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!.toString();
      const { notificationId } = req.params;

      if (!notificationId) {
        res.status(400).json({ error: "Notification ID is required" });
        return;
      }

      const notification = await Notification.markAsRead(
        notificationId,
        userId
      );

      res.json({
        message: "Notification marked as read",
        notification: notification.toJSON(),
      });
    } catch (error: any) {
      console.error("Mark notification as read error:", error);
      if (
        error.message.includes("not found") ||
        error.message.includes("not authorized")
      ) {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Mark all notifications as read
router.put(
  "/read-all",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!.toString();
      await Notification.markAllAsRead(userId);

      res.json({
        message: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete notification
router.delete(
  "/:notificationId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!.toString();
      const { notificationId } = req.params;

      if (!notificationId) {
        res.status(400).json({ error: "Notification ID is required" });
        return;
      }

      await Notification.deleteNotification(notificationId, userId);

      res.json({
        message: "Notification deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete notification error:", error);
      if (
        error.message.includes("not found") ||
        error.message.includes("not authorized")
      ) {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
