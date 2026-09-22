import { useCallback, useRef, useState } from "react";
import { REACTION_POLICY } from "@shared/reactions";
import { Icon } from "../atoms";
import { cn } from "../../lib/cn";
import { useDeleteMessage, useEditMessage } from "../../hooks/useMessaging";
import { useToggleReaction } from "../../hooks/useReactions";
import type { ReactionTargetRef } from "../../lib/reactions";
import { messageDomId } from "./MessageList";
import ReactionPicker from "../reactions/ReactionPicker";
import ReactionBar from "../reactions/ReactionBar";
import ReactorsModal from "../reactions/ReactorsModal";
import type { Message, ReactionType } from "../../types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  currentUserId: number | undefined;
  isConsecutive: boolean;
  /** This message is the pending reply target. */
  isReplyTarget: boolean;
  /** Briefly highlighted after a jump-to. */
  isFlashing: boolean;
  onReply: (message: Message) => void;
  onJumpTo: (messageId: string) => void;
}

export function MessageBubble({
  message,
  isOwn,
  currentUserId,
  isConsecutive,
  isReplyTarget,
  isFlashing,
  onReply,
  onJumpTo,
}: MessageBubbleProps) {
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage(message.conversationId);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [menuOpen, setMenuOpen] = useState(false);

  // ---- Reactions (hooks must run before the system-message early return) ----
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showReactors, setShowReactors] = useState(false);
  const pickerBoundaryRef = useRef<HTMLDivElement>(null);
  const reactionTarget: ReactionTargetRef = {
    targetType: "message",
    conversationId: message.conversationId,
    messageId: message.id,
  };
  const toggleReaction = useToggleReaction(reactionTarget);
  const closePicker = useCallback(() => setPickerOpen(false), []);
  const react = (type: ReactionType): void =>
    toggleReaction.mutate({ type, current: message.reactions });
  const pickReaction = (type: ReactionType): void => {
    react(type);
    // Single: picking is final. Multi: stay open to toggle several.
    if (REACTION_POLICY.message === "single") closePicker();
  };

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (message.messageType === "system") {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const submitEdit = async (): Promise<void> => {
    const content = editContent.trim();
    if (content && content !== message.content) {
      await editMessage.mutateAsync({ messageId: message.id, content });
    }
    setIsEditing(false);
  };

  const cancelEdit = (): void => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const parent = message.replyTo ?? null;
  const parentAuthor = !parent
    ? null
    : parent.senderId === currentUserId
      ? "You"
      : parent.sender
        ? `${parent.sender.firstName} ${parent.sender.lastName}`
        : "Unknown user";

  const highlight = isFlashing
    ? "bg-yellow-100"
    : isReplyTarget
      ? "bg-primary-50/60"
      : "";

  return (
    <div
      id={messageDomId(message.id)}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} group scroll-mt-4 rounded-lg -mx-2 px-2 py-1 transition-colors duration-500 ${highlight}`}
    >
      <div className={`max-w-xs lg:max-w-md ${isOwn ? "order-2" : "order-1"}`}>
        {!isConsecutive && !isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {message.sender?.firstName} {message.sender?.lastName}
            </span>
            <span className="text-xs text-gray-500">{time}</span>
          </div>
        )}

        {/* Quoted parent: author + excerpt, links to the original. */}
        {parent ? (
          <button
            type="button"
            onClick={() => onJumpTo(parent.id)}
            title="Go to the original message"
            className={`mb-1 w-full text-left pl-3 pr-2 py-1 border-l-2 rounded-r-md text-xs transition-colors ${
              isOwn
                ? "border-primary-300 bg-primary-50 hover:bg-primary-100"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center gap-1 font-medium text-gray-700">
              <Icon name="reply" size="small" className="h-3 w-3" />
              {parentAuthor}
            </span>
            <span className="block truncate text-gray-500">
              {parent.content}
            </span>
          </button>
        ) : message.replyToId ? (
          <div className="mb-1 pl-3 border-l-2 border-gray-200 text-xs italic text-gray-400">
            Original message was deleted
          </div>
        ) : null}

        {isEditing ? (
          <div className="bg-white border border-gray-300 rounded-lg p-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submitEdit();
                } else if (e.key === "Escape") {
                  cancelEdit();
                }
              }}
              rows={2}
              autoFocus
              className="w-full resize-none text-sm outline-none"
            />
            <div className="flex justify-end gap-2 mt-1 text-xs">
              <button
                type="button"
                onClick={cancelEdit}
                className="text-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitEdit()}
                className="text-primary-600"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`px-4 py-2 rounded-lg ${
              isOwn ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-900"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            {message.isEdited && (
              <span
                className={`text-xs ml-2 ${
                  isOwn ? "text-primary-200" : "text-gray-500"
                }`}
              >
                (edited)
              </span>
            )}
          </div>
        )}

        <ReactionBar
          summary={message.reactions}
          onToggle={react}
          onShowReactors={() => setShowReactors(true)}
          disabled={toggleReaction.isPending}
          size="sm"
          className={cn("mt-1", isOwn && "justify-end")}
        />
      </div>

      {!isEditing && (
        <div
          className={cn(
            "flex items-start gap-1 mx-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100",
            (pickerOpen || menuOpen) && "opacity-100",
            isOwn ? "order-1" : "order-2",
          )}
        >
          <div ref={pickerBoundaryRef} className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              disabled={toggleReaction.isPending}
              aria-label="React to this message"
              aria-haspopup="true"
              aria-expanded={pickerOpen}
              title="React"
              className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              <Icon name="smilePlus" size="small" />
            </button>
            {pickerOpen && (
              <ReactionPicker
                mine={message.reactions.mine}
                onSelect={pickReaction}
                onClose={closePicker}
                autoFocus
                disabled={toggleReaction.isPending}
                placement="top"
                align={isOwn ? "right" : "left"}
                boundaryRef={pickerBoundaryRef}
              />
            )}
          </div>
          <button
            type="button"
            onClick={() => onReply(message)}
            aria-label="Reply to this message"
            title="Reply"
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <Icon name="reply" size="small" />
          </button>
          {isOwn && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="More actions"
                title="More"
                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Icon name="more" size="small" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-7 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10 min-w-28">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Icon name="edit" size="small" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Delete this message?")) {
                        deleteMessage.mutate(message.id);
                      }
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <Icon name="trash" size="small" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showReactors && (
        <ReactorsModal
          target={reactionTarget}
          summary={message.reactions}
          onClose={() => setShowReactors(false)}
        />
      )}
    </div>
  );
}
