import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMessaging } from "../../hooks/useMessaging";
import { MessageBubble } from "./MessageBubble";

export function MessageList({ messages, conversationId, onReply }) {
  const { loadMessages } = useMessaging();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const containerRef = useRef(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const handleScroll = useCallback(async () => {
    if (!containerRef.current || isLoadingMore || !hasMoreMessages) return;

    const { scrollTop } = containerRef.current;

    // Load more messages when scrolled to top
    if (scrollTop === 0 && messages.length > 0) {
      setIsLoadingMore(true);

      try {
        const olderMessages = await loadMessages(
          conversationId,
          50,
          messages.length
        );
        if (olderMessages.length === 0) {
          setHasMoreMessages(false);
        }
      } catch (error) {
        console.error("Error loading more messages:", error);
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [
    conversationId,
    messages.length,
    isLoadingMore,
    hasMoreMessages,
    loadMessages,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt).toDateString();

      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  const formatDateLabel = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const groupedMessages = groupMessagesByDate(messages);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No messages yet
          </h3>
          <p className="text-gray-500">
            Start the conversation by sending a message below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      style={{ scrollBehavior: "smooth" }}
    >
      {/* Loading indicator for older messages */}
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* No more messages indicator */}
      {!hasMoreMessages && messages.length > 20 && (
        <div className="flex justify-center py-2">
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            Beginning of conversation
          </span>
        </div>
      )}

      {/* Messages grouped by date */}
      {groupedMessages.map((group) => (
        <div key={group.date}>
          {/* Date separator */}
          <div className="flex justify-center my-4">
            <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
              {formatDateLabel(group.date)}
            </span>
          </div>

          {/* Messages for this date */}
          <div className="space-y-2">
            {group.messages.map((message, index) => {
              const prevMessage = index > 0 ? group.messages[index - 1] : null;
              const isConsecutive =
                prevMessage &&
                prevMessage.senderId === message.senderId &&
                new Date(message.createdAt) - new Date(prevMessage.createdAt) <
                  5 * 60 * 1000; // 5 minutes

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isConsecutive={isConsecutive}
                  onReply={onReply}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
