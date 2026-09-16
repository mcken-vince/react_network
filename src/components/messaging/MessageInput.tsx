import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import type { Message } from "../../types";

interface MessageInputProps {
  conversationId: string;
  onSendMessage: (content: string) => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  /** Message the next send will reply to; rendered as a dismissible chip. */
  replyTo?: Message | null;
  currentUserId?: number;
  onCancelReply?: () => void;
}

export function MessageInput({
  conversationId,
  onSendMessage,
  disabled = false,
  placeholder = "Type a message…",
  replyTo = null,
  currentUserId,
  onCancelReply,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const { sendTyping } = useWebSocket();
  const typingRef = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tagging a message should drop you straight into the composer.
  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  const signalTyping = (): void => {
    if (!typingRef.current) {
      typingRef.current = true;
      sendTyping(conversationId, true);
    }
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => {
      typingRef.current = false;
      sendTyping(conversationId, false);
    }, 2_000);
  };

  const stopTyping = (): void => {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    if (typingRef.current) {
      typingRef.current = false;
      sendTyping(conversationId, false);
    }
  };

  const submit = async (): Promise<void> => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    setContent("");
    stopTyping();
    await onSendMessage(trimmed);
  };

  const replyAuthor =
    replyTo?.senderId === currentUserId
      ? "yourself"
      : (replyTo?.sender?.firstName ?? "someone");

  return (
    <div className="p-4">
      {replyTo && (
        <div className="flex items-start gap-2 mb-2 pl-3 pr-2 py-2 rounded-md bg-gray-50 border-l-2 border-primary-500">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary-700">
              Replying to {replyAuthor}
            </p>
            <p className="text-xs text-gray-500 truncate">{replyTo.content}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-gray-400 hover:text-gray-600 text-sm leading-none p-1"
            aria-label="Cancel reply"
          >
            ✕
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="flex items-end gap-3"
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            signalTyping();
          }}
          onBlur={stopTyping}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            } else if (e.key === "Escape" && replyTo) {
              onCancelReply?.();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !content.trim()}
          className="p-3 rounded-lg bg-primary-600 text-white disabled:bg-gray-200 disabled:text-gray-400"
        >
          {replyTo ? "Reply" : "Send"}
        </button>
      </form>
    </div>
  );
}
