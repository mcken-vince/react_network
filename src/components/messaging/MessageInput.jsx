import React, { useState, useRef } from "react";

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
}) {
  const [content, setContent] = useState("");
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedContent = content.trim();
    if (!trimmedContent || disabled) return;

    try {
      await onSendMessage(trimmedContent);
      setContent("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Shift") {
      setIsShiftPressed(true);
    }

    if (e.key === "Enter" && !isShiftPressed) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === "Shift") {
      setIsShiftPressed(false);
    }
  };

  const handleInput = (e) => {
    setContent(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              minHeight: "52px",
              maxHeight: "120px",
            }}
            rows={1}
          />

          {/* Character count (if message is long) */}
          {content.length > 4000 && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {content.length}/5000
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={disabled || !content.trim()}
          className={`flex-shrink-0 p-3 rounded-lg transition-colors ${
            disabled || !content.trim()
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          }`}
          title="Send message"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </form>

      {/* Help text */}
      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
        <span>Press Enter to send, Shift+Enter for new line</span>
        {content.length > 4500 && (
          <span
            className={
              content.length > 4900 ? "text-red-500" : "text-yellow-600"
            }
          >
            {5000 - content.length} characters remaining
          </span>
        )}
      </div>
    </div>
  );
}
