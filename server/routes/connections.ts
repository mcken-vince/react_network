import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { Connection, Notification } from "../models";
import type { Response } from "express";
import type { AuthRequest } from "../types";

const router = express.Router();

// Send a connection request
router.post(
  "/request",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const requesterId = req.userId!;
      const { recipientId } = req.body;

      if (!recipientId) {
        res.status(400).json({ error: "Recipient ID is required" });
        return;
      }

      const connection = await Connection.sendConnectionRequest(
        requesterId,
        recipientId
      );

      // Create notification for the recipient
      try {
        await Notification.createConnectionRequestNotification(
          recipientId,
          requesterId,
          connection.id
        );
      } catch (notificationError) {
        console.error(
          "Error creating connection request notification:",
          notificationError
        );
        // Don't fail the request if notification fails
      }

      res.status(201).json({
        message: "Connection request sent successfully",
        connection: connection.toJSON(),
      });
    } catch (error: any) {
      console.error("Send connection request error:", error);
      if (
        error.message.includes("already exists") ||
        error.message.includes("Cannot send")
      ) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Accept a connection request
router.put(
  "/:connectionId/accept",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { connectionId } = req.params;

      const connection = await Connection.acceptConnectionRequest(
        parseInt(connectionId!),
        userId
      );

      // Create notification for the requester
      try {
        await Notification.createConnectionAcceptedNotification(
          connection.requesterId,
          userId,
          connection.id
        );
      } catch (notificationError) {
        console.error(
          "Error creating connection accepted notification:",
          notificationError
        );
        // Don't fail the request if notification fails
      }

      res.json({
        message: "Connection request accepted",
        connection: connection.toJSON(),
      });
    } catch (error: any) {
      console.error("Accept connection request error:", error);
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

// Reject a connection request
router.put(
  "/:connectionId/reject",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { connectionId } = req.params;

      const connection = await Connection.rejectConnectionRequest(
        parseInt(connectionId!),
        userId
      );

      // Create notification for the requester
      try {
        await Notification.createConnectionRejectedNotification(
          connection.requesterId,
          userId,
          connection.id
        );
      } catch (notificationError) {
        console.error(
          "Error creating connection rejected notification:",
          notificationError
        );
        // Don't fail the request if notification fails
      }

      res.json({
        message: "Connection request rejected",
        connection: connection.toJSON(),
      });
    } catch (error: any) {
      console.error("Reject connection request error:", error);
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

// Get pending connection requests (incoming)
router.get(
  "/pending",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const pendingRequests = await Connection.getPendingRequests(userId);
      res.json({ requests: pendingRequests });
    } catch (error) {
      console.error("Get pending requests error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get sent connection requests (outgoing)
router.get(
  "/sent",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const sentRequests = await Connection.getSentRequests(userId);
      res.json({ requests: sentRequests });
    } catch (error) {
      console.error("Get sent requests error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get user's connections (accepted)
router.get(
  "/connections",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const connections = await Connection.getUserConnections(userId);
      res.json({ connections });
    } catch (error) {
      console.error("Get connections error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Remove/cancel a connection
router.delete(
  "/:connectionId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { connectionId } = req.params;

      await Connection.removeConnection(parseInt(connectionId!), userId);
      res.json({ message: "Connection removed successfully" });
    } catch (error: any) {
      console.error("Remove connection error:", error);
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
