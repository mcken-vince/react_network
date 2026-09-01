import { Router } from "express";
import { Connection, User } from "../models";
import { authenticateToken } from "../middleware/auth";
import { authed, bodyInt, intParam } from "../lib/http";
import { toWire } from "../lib/serialize";
import { BadRequestError, NotFoundError } from "../lib/errors";
import {
  notifyConnectionAccepted,
  notifyConnectionRejected,
  notifyConnectionRequested,
} from "../services/notificationService";
import type {
  Connection as ConnectionDto,
  ConnectionRequestsResponse,
  ConnectionResponse,
  ConnectionsListResponse,
  SuccessMessageResponse,
} from "../types";

const router = Router();
router.use(authenticateToken);

const connectionResponse = (
  message: string,
  connection: Connection,
): ConnectionResponse => ({
  message,
  connection: toWire<ConnectionDto>(connection),
});

// POST /connections/request  { recipientId }
router.post(
  "/request",
  authed(async (req, res) => {
    const recipientId = bodyInt(req, "recipientId");
    if (recipientId === req.userId) {
      throw new BadRequestError("Cannot send connection request to yourself");
    }

    const recipient = await User.findByPk(recipientId, { attributes: ["id"] });
    if (!recipient) throw new NotFoundError("Recipient not found");

    const connection = await Connection.sendConnectionRequest(
      req.userId,
      recipientId,
    );

    // If they had already asked us, our "Connect" accepted their request.
    const autoAccepted = connection.status === "accepted";
    if (autoAccepted) {
      await notifyConnectionAccepted(
        connection.requesterId,
        req.userId,
        connection.id,
      );
    } else {
      await notifyConnectionRequested(recipientId, req.userId, connection.id);
    }

    res
      .status(autoAccepted ? 200 : 201)
      .json(
        connectionResponse(
          autoAccepted
            ? "Connection request accepted"
            : "Connection request sent successfully",
          connection,
        ),
      );
  }),
);

router.put(
  "/:connectionId/accept",
  authed(async (req, res) => {
    const connection = await Connection.acceptConnectionRequest(
      intParam(req, "connectionId"),
      req.userId,
    );
    await notifyConnectionAccepted(
      connection.requesterId,
      req.userId,
      connection.id,
    );
    res.json(connectionResponse("Connection request accepted", connection));
  }),
);

router.put(
  "/:connectionId/reject",
  authed(async (req, res) => {
    const connection = await Connection.rejectConnectionRequest(
      intParam(req, "connectionId"),
      req.userId,
    );
    await notifyConnectionRejected(
      connection.requesterId,
      req.userId,
      connection.id,
    );
    res.json(connectionResponse("Connection request rejected", connection));
  }),
);

// Incoming pending requests
router.get(
  "/pending",
  authed(async (req, res) => {
    const requests = await Connection.getPendingRequests(req.userId);
    res.json({
      requests: requests.map((c) => toWire<ConnectionDto>(c)),
    } satisfies ConnectionRequestsResponse);
  }),
);

// Outgoing pending requests
router.get(
  "/sent",
  authed(async (req, res) => {
    const requests = await Connection.getSentRequests(req.userId);
    res.json({
      requests: requests.map((c) => toWire<ConnectionDto>(c)),
    } satisfies ConnectionRequestsResponse);
  }),
);

// Accepted connections
router.get(
  "/connections",
  authed(async (req, res) => {
    const connections = await Connection.getUserConnections(req.userId);
    res.json({
      connections: connections.map((c) => toWire<ConnectionDto>(c)),
    } satisfies ConnectionsListResponse);
  }),
);

// Remove a connection or cancel a sent request
router.delete(
  "/:connectionId",
  authed(async (req, res) => {
    await Connection.removeConnection(
      intParam(req, "connectionId"),
      req.userId,
    );
    res.json({
      message: "Connection removed successfully",
    } satisfies SuccessMessageResponse);
  }),
);

export default router;
