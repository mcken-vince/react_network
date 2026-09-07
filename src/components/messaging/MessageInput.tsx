import { useRef, useState } from "react";
import { useWebSocket } from "../../context/WebSocketContext";

interface MessageInputProps {
  conversationId: string;
  onSendMessage: (content: string) => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  conversationId,
  onSendMessage,
  disabled = false,
  placeholder = "Type a message…",
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const { sendTyping } = useWebSocket();
  const typingRef = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <div className="p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="flex items-end gap-3"
      >
        <textarea
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
          Send
        </button>
      </form>
    </div>
  );
}
