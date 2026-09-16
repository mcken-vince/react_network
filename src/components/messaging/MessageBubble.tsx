import { useState } from "react";
import { useDeleteMessage, useEditMessage } from "../../hooks/useMessaging";
import type { Message } from "../../types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isConsecutive: boolean;
  /** This message is the pending reply target. */
  isReplyTarget: boolean;
  onReply: (message: Message) => void;
}

export function MessageBubble({
  message,
  isOwn,
  isConsecutive,
  isReplyTarget,
  onReply,
}: MessageBubbleProps) {
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage(message.conversationId);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} group ${
        isReplyTarget ? "bg-primary-50/60 rounded-lg -mx-2 px-2 py-1" : ""
      }`}
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

        {message.replyTo && (
          <div className="mb-1 pl-3 border-l-2 border-gray-300 text-xs text-gray-500 truncate">
            {message.replyTo.content}
          </div>
        )}

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
                  setIsEditing(false);
                  setEditContent(message.content);
                }
              }}
              rows={2}
              autoFocus
              className="w-full resize-none text-sm outline-none"
            />
            <div className="flex justify-end gap-2 mt-1 text-xs">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(message.content);
                }}
                className="text-gray-500"
              >
                Cancel
              </button>
              <button
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
      </div>

      {!isEditing && (
        <div
          className={`flex items-start gap-1 mx-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 ${
            isOwn ? "order-1" : "order-2"
          }`}
        >
          <button
            type="button"
            onClick={() => onReply(message)}
            aria-label="Reply to this message"
            className="p-1 text-gray-400 hover:text-gray-600 focus:opacity-100"
            title="Reply"
          >
            ↩
          </button>
          {isOwn && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="More"
              >
                ⋯
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-7 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10 min-w-24">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this message?")) {
                        deleteMessage.mutate(message.id);
                      }
                      setMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
