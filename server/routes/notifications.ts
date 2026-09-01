import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { authed, intParam, pagination, queryBool } from "../lib/http";
import { toWire } from "../lib/serialize";
import {
  deleteNotification,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";
import type {
  Notification as NotificationDto,
  NotificationResponse,
  NotificationsResponse,
  SuccessMessageResponse,
  UnreadCountResponse,
} from "../types";

const router = Router();
router.use(authenticateToken);

// GET /notifications?limit&offset&unreadOnly=true
router.get(
  "/",
  authed(async (req, res) => {
    const notifications = await listNotifications(req.userId, {
      ...pagination(req),
      unreadOnly: queryBool(req, "unreadOnly"),
    });
    res.json({
      notifications: notifications.map((n) => toWire<NotificationDto>(n)),
      count: notifications.length,
    } satisfies NotificationsResponse);
  }),
);

router.get(
  "/unread-count",
  authed(async (req, res) => {
    const count = await getUnreadNotificationCount(req.userId);
    res.json({ count } satisfies UnreadCountResponse);
  }),
);

// Registered before "/:notificationId/read" for clarity (the patterns don't collide).
router.put(
  "/read-all",
  authed(async (req, res) => {
    await markAllNotificationsRead(req.userId);
    res.json({
      message: "All notifications marked as read",
    } satisfies SuccessMessageResponse);
  }),
);

router.put(
  "/:notificationId/read",
  authed(async (req, res) => {
    const notification = await markNotificationRead(
      intParam(req, "notificationId"),
      req.userId,
    );
    res.json({
      message: "Notification marked as read",
      notification: toWire<NotificationDto>(notification),
    } satisfies NotificationResponse);
  }),
);

router.delete(
  "/:notificationId",
  authed(async (req, res) => {
    await deleteNotification(intParam(req, "notificationId"), req.userId);
    res.json({
      message: "Notification deleted successfully",
    } satisfies SuccessMessageResponse);
  }),
);

export default router;
