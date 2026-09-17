import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "../../types";

interface MessageListProps {
  messages: Message[];
  currentUserId: number | undefined;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  /** Currently tagged reply target — highlighted in the list. */
  replyToId: string | null;
  /** Tag a message as the reply target (does not send anything). */
  onReply: (message: Message) => void;
  /** Deep link: jump to this message once it's available. */
  jumpToMessageId?: string | null;
}

const NEAR_BOTTOM_PX = 150;
/** How many older pages we'll pull in while hunting for a jump target. */
const MAX_JUMP_PAGES = 20;
const FLASH_MS = 1_600;

export const messageDomId = (messageId: string): string =>
  `message-${messageId}`;

function groupByDate(
  messages: Message[],
): { date: string; messages: Message[] }[] {
  const groups: { date: string; messages: Message[] }[] = [];
  for (const message of messages) {
    const date = new Date(message.createdAt).toDateString();
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.messages.push(message);
    else groups.push({ date, messages: [message] });
  }
  return groups;
}

function dateLabel(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  if (date.toDateString() === today) return "Today";
  if (date.toDateString() === yesterday) return "Yesterday";
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function MessageList({
  messages,
  currentUserId,
  hasMore,
  isLoadingMore,
  onLoadMore,
  replyToId,
  onReply,
  jumpToMessageId = null,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Newest message id we've already scrolled to.
  const lastSeenMessageId = useRef<string | null>(null);
  // scrollHeight captured just before a "load older" fetch.
  const scrollHeightBeforeLoad = useRef<number | null>(null);

  // ---- Jump-to-message -----------------------------------------------------
  // A jump target may live in a page we haven't loaded yet; we keep fetching
  // older pages until it shows up (or we give up).
  const pendingJump = useRef<{ id: string; pagesLoaded: number } | null>(null);
  const [jumpTick, setJumpTick] = useState(0);
  const [flashId, setFlashId] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jumpTo = useCallback((messageId: string) => {
    pendingJump.current = { id: messageId, pagesLoaded: 0 };
    setJumpTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (jumpToMessageId) jumpTo(jumpToMessageId);
  }, [jumpToMessageId, jumpTo]);

  useEffect(() => {
    const pending = pendingJump.current;
    if (!pending) return;
    const el = document.getElementById(messageDomId(pending.id));
    if (el) {
      pendingJump.current = null;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlashId(pending.id);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlashId(null), FLASH_MS);
      return;
    }
    if (isLoadingMore) return;
    if (hasMore && pending.pagesLoaded < MAX_JUMP_PAGES) {
      pending.pagesLoaded += 1;
      onLoadMore();
    } else {
      pendingJump.current = null; // not found — give up quietly
    }
  }, [messages, hasMore, isLoadingMore, onLoadMore, jumpTick]);

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    [],
  );

  // ---- Scroll management ---------------------------------------------------

  // Keep the viewport anchored when older messages are prepended by scrolling.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (el && scrollHeightBeforeLoad.current !== null) {
      el.scrollTop += el.scrollHeight - scrollHeightBeforeLoad.current;
      scrollHeightBeforeLoad.current = null;
    }
  });

  // Scroll to the bottom on first load, and on a new message only when the
  // reader is already near the bottom — never yank them out of history.
  useEffect(() => {
    const el = containerRef.current;
    const newest = messages[messages.length - 1];
    if (!el || !newest || lastSeenMessageId.current === newest.id) return;
    const isFirstRender = lastSeenMessageId.current === null;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    lastSeenMessageId.current = newest.id;
    if ((isFirstRender && !pendingJump.current) || nearBottom) {
      bottomRef.current?.scrollIntoView({
        behavior: isFirstRender ? "auto" : "smooth",
      });
    }
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || isLoadingMore || !hasMore) return;
    if (el.scrollTop <= 0) {
      scrollHeightBeforeLoad.current = el.scrollHeight;
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
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
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
        </div>
      )}
      {!hasMore && (
        <div className="flex justify-center py-2">
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            Beginning of conversation
          </span>
        </div>
      )}

      {groupByDate(messages).map((group) => (
        <div key={group.date}>
          <div className="flex justify-center my-4">
            <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
              {dateLabel(group.date)}
            </span>
          </div>
          <div className="space-y-2">
            {group.messages.map((message, index) => {
              const prev = group.messages[index - 1];
              const isConsecutive =
                !!prev &&
                prev.senderId === message.senderId &&
                new Date(message.createdAt).getTime() -
                  new Date(prev.createdAt).getTime() <
                  5 * 60 * 1000;
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === currentUserId}
                  currentUserId={currentUserId}
                  isConsecutive={isConsecutive}
                  isReplyTarget={message.id === replyToId}
                  isFlashing={message.id === flashId}
                  onReply={onReply}
                  onJumpTo={jumpTo}
                />
              );
            })}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
