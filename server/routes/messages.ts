import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  authed,
  bodyStringArray,
  pagination,
  queryInt,
  queryString,
  uuidParam,
  validated,
  intParam,
} from "../lib/http";
import { toWire } from "../lib/serialize";
import {
  addParticipants,
  getConversation,
  listConversations,
  removeParticipant,
  renameGroup,
  startDirectConversation,
  startGroupConversation,
} from "../services/conversationService";
import {
  deleteMessage,
  editMessage,
  listMessages,
  markConversationRead,
  sendMessage,
} from "../services/messageService";
import {
  validateAddParticipants,
  validateConversationRename,
  validateDirectConversation,
  validateGroupConversation,
  validateMessage,
} from "../utils/validation";
import type {
  Conversation as ConversationDto,
  ConversationResponse,
  ConversationsResponse,
  MessageResponse,
  MessagesResponse,
  SuccessMessageResponse,
} from "../types";

const router = Router();
router.use(authenticateToken);

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

// GET /conversations?limit&offset — each with lastMessage + unreadCount
router.get(
  "/conversations",
  authed(async (req, res) => {
    const conversations = await listConversations(req.userId, pagination(req));
    res.json({ conversations } satisfies ConversationsResponse);
  }),
);

// POST /conversations  { recipientId } — find or create a direct conversation
router.post(
  "/conversations",
  authed(async (req, res) => {
    const { recipientId } = validated(validateDirectConversation(req.body));
    const { conversation, created } = await startDirectConversation(
      req.userId,
      recipientId,
    );
    res
      .status(created ? 201 : 200)
      .json({ conversation, created } satisfies ConversationResponse);
  }),
);

// POST /conversations/group  { name, participantIds }
router.post(
  "/conversations/group",
  authed(async (req, res) => {
    const { name, participantIds } = validated(
      validateGroupConversation(req.body),
    );
    const conversation = await startGroupConversation(
      req.userId,
      name,
      participantIds,
    );
    res.status(201).json({ conversation } satisfies ConversationResponse);
  }),
);

router.get(
  "/conversations/:conversationId",
  authed(async (req, res) => {
    const conversation = await getConversation(
      uuidParam(req, "conversationId"),
      req.userId,
    );
    res.json({
      conversation: toWire<ConversationDto>(conversation),
    } satisfies ConversationResponse);
  }),
);

// PUT /conversations/:id/read  { messageIds?: string[] }
router.put(
  "/conversations/:conversationId/read",
  authed(async (req, res) => {
    await markConversationRead(
      uuidParam(req, "conversationId"),
      req.userId,
      bodyStringArray(req, "messageIds"),
    );
    res.json({
      message: "Conversation marked as read",
    } satisfies SuccessMessageResponse);
  }),
);

// ---------------------------------------------------------------------------
// Group management
// ---------------------------------------------------------------------------

// PUT /conversations/:id  { name } — admins only
router.put(
  "/conversations/:conversationId",
  authed(async (req, res) => {
    const { name } = validated(validateConversationRename(req.body));
    const conversation = await renameGroup(
      uuidParam(req, "conversationId"),
      req.userId,
      name,
    );
    res.json({ conversation } satisfies ConversationResponse);
  }),
);

// POST /conversations/:id/participants  { userIds } — admins only
router.post(
  "/conversations/:conversationId/participants",
  authed(async (req, res) => {
    const { userIds } = validated(validateAddParticipants(req.body));
    const conversation = await addParticipants(
      uuidParam(req, "conversationId"),
      req.userId,
      userIds,
    );
    res.json({ conversation } satisfies ConversationResponse);
  }),
);

// DELETE /conversations/:id/participants/:userId — admin removes a member,
// or a member removes themselves (leave)
router.delete(
  "/conversations/:conversationId/participants/:userId",
  authed(async (req, res) => {
    await removeParticipant(
      uuidParam(req, "conversationId"),
      req.userId,
      intParam(req, "userId"),
    );
    res.json({
      message: "Participant removed",
    } satisfies SuccessMessageResponse);
  }),
);

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

// GET /conversations/:id/messages?limit&beforeMessageId — newest first
router.get(
  "/conversations/:conversationId/messages",
  authed(async (req, res) => {
    const result = await listMessages(
      uuidParam(req, "conversationId"),
      req.userId,
      {
        limit: queryInt(req, "limit"),
        beforeMessageId: queryString(req, "beforeMessageId"),
      },
    );
    res.json(result satisfies MessagesResponse);
  }),
);

// POST /conversations/:id/messages  { content, replyToId? }
router.post(
  "/conversations/:conversationId/messages",
  authed(async (req, res) => {
    const data = validated(validateMessage(req.body));
    const message = await sendMessage(
      uuidParam(req, "conversationId"),
      req.userId,
      data,
    );
    res.status(201).json({ message } satisfies MessageResponse);
  }),
);

// PUT /messages/:id  { content }
router.put(
  "/messages/:messageId",
  authed(async (req, res) => {
    const { content } = validated(validateMessage(req.body));
    const message = await editMessage(
      uuidParam(req, "messageId"),
      req.userId,
      content,
    );
    res.json({ message } satisfies MessageResponse);
  }),
);

router.delete(
  "/messages/:messageId",
  authed(async (req, res) => {
    await deleteMessage(uuidParam(req, "messageId"), req.userId);
    res.json({
      message: "Message deleted successfully",
    } satisfies SuccessMessageResponse);
  }),
);

export default router;
