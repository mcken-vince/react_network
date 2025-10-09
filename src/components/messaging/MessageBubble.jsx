import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useMessaging } from "../../hooks/useMessaging";

export function MessageBubble({ message, isConsecutive, onReply }) {
  const { user } = useAuth();
  const { editMessage, deleteMessage } = useMessaging();
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isOwnMessage = message.senderId === user?.id;

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      try {
        await editMessage(
          message.conversationId,
          message.id,
          editContent.trim()
        );
        setIsEditing(false);
      } catch (error) {
        console.error("Error editing message:", error);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessage(message.conversationId, message.id);
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    }
    setIsMenuOpen(false);
  };

  const handleReply = () => {
    onReply && onReply(message.content, message.id);
    setIsMenuOpen(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  // System messages (like user joined/left)
  if (message.messageType === "system") {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setIsMenuOpen(false);
      }}
    >
      <div
        className={`max-w-xs lg:max-w-md ${isOwnMessage ? "order-2" : "order-1"}`}
      >
        {/* Sender name and timestamp (if not consecutive) */}
        {!isConsecutive && !isOwnMessage && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {message.sender?.firstName} {message.sender?.lastName}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}

        {/* Reply to message indicator */}
        {message.replyTo && (
          <div className="mb-2 pl-4 border-l-2 border-gray-300">
            <p className="text-xs text-gray-500 mb-1">
              Replying to {message.replyTo.sender?.firstName}
            </p>
            <p className="text-sm text-gray-700 truncate">
              {message.replyTo.content}
            </p>
          </div>
        )}

        {/* Message content */}
        <div className="relative">
          {isEditing ? (
            <div className="bg-white border border-gray-300 rounded-lg p-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleEdit}
                className="w-full resize-none border-none outline-none text-sm"
                rows="2"
                autoFocus
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`px-4 py-2 rounded-lg ${
                isOwnMessage
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-900"
              } ${isConsecutive ? "mt-1" : "mt-0"}`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>

              {/* Edited indicator */}
              {message.isEdited && (
                <span
                  className={`text-xs ${isOwnMessage ? "text-primary-200" : "text-gray-500"} ml-2`}
                >
                  (edited)
                </span>
              )}
            </div>
          )}

          {/* Timestamp for own messages or consecutive messages */}
          {(isOwnMessage || isConsecutive) && !isEditing && (
            <div
              className={`flex ${isOwnMessage ? "justify-start" : "justify-end"} mt-1`}
            >
              <span className="text-xs text-gray-500">
                {formatTime(message.createdAt)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Message actions */}
      {showActions && !isEditing && (
        <div
          className={`flex items-center space-x-1 mx-2 ${isOwnMessage ? "order-1" : "order-2"}`}
        >
          {/* Reply button */}
          <button
            onClick={handleReply}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-all"
            title="Reply"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          </button>

          {/* More actions (edit/delete for own messages) */}
          {isOwnMessage && (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-all"
                title="More actions"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isMenuOpen && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1 min-w-24">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
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
