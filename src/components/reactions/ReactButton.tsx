import { useCallback, useEffect, useRef, useState } from "react";
import { REACTIONS, REACTION_POLICY } from "@shared/reactions";
import { Icon } from "../atoms";
import { cn } from "../../lib/cn";
import { QUICK_REACTION } from "../../lib/reactions";
import ReactionPicker from "./ReactionPicker";
import type {
  ReactionSummary,
  ReactionTargetType,
  ReactionType,
} from "../../types";

const HOVER_OPEN_MS = 450;
const HOVER_CLOSE_MS = 300;
const LONG_PRESS_MS = 450;
/** Browsers fire a synthetic mouseenter right after a tap; ignore it. */
const TOUCH_MOUSE_GUARD_MS = 800;

const SIZE = {
  sm: "gap-1 px-1.5 py-0.5 text-xs",
  md: "gap-1.5 px-2 py-1 text-sm",
} as const;

interface ReactButtonProps {
  summary: ReactionSummary;
  targetType: ReactionTargetType;
  onToggle: (type: ReactionType) => void;
  disabled?: boolean;
  size?: keyof typeof SIZE;
  placement?: "top" | "bottom";
  align?: "left" | "right";
}

export default function ReactButton({
  summary,
  targetType,
  onToggle,
  disabled = false,
  size = "md",
  placement = "top",
  align = "left",
}: ReactButtonProps) {
  const [open, setOpen] = useState(false);
  const [focusOnOpen, setFocusOnOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedByHover = useRef(false);
  const suppressNextClick = useRef(false);
  const lastTouchAt = useRef(0);

  const clearTimers = useCallback(() => {
    for (const timer of [openTimer, closeTimer, pressTimer]) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const policy = REACTION_POLICY[targetType];
  // Single: the button mirrors your reaction. Multi: it's a dedicated
  // toggle for the quick reaction; the others live in the picker/bar.
  const shown: ReactionType | null =
    policy === "single"
      ? (summary.mine[summary.mine.length - 1] ?? null)
      : summary.mine.includes(QUICK_REACTION)
        ? QUICK_REACTION
        : null;

  const openPicker = (withFocus: boolean, viaHover: boolean) => {
    clearTimers();
    openedByHover.current = viaHover;
    setFocusOnOpen(withFocus);
    setOpen(true);
  };

  const closePicker = useCallback(() => {
    clearTimers();
    setOpen(false);
  }, [clearTimers]);

  // ---- Hover intent (desktop) ----------------------------------------------
  const handleMouseEnter = () => {
    if (disabled || Date.now() - lastTouchAt.current < TOUCH_MOUSE_GUARD_MS) {
      return;
    }
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (!open && !openTimer.current) {
      openTimer.current = setTimeout(() => {
        openTimer.current = null;
        openPicker(false, true);
      }, HOVER_OPEN_MS);
    }
  };

  const handleMouseLeave = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    // Explicitly opened pickers (click/keyboard/long-press) stay open.
    if (open && openedByHover.current) {
      closeTimer.current = setTimeout(() => {
        closeTimer.current = null;
        setOpen(false);
      }, HOVER_CLOSE_MS);
    }
  };

  // ---- Long press (touch) --------------------------------------------------
  const handleTouchStart = () => {
    lastTouchAt.current = Date.now();
    if (disabled) return;
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      suppressNextClick.current = true;
      openPicker(false, false);
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  // ---- Actions -------------------------------------------------------------
  const handleQuickClick = () => {
    if (suppressNextClick.current) {
      suppressNextClick.current = false; // this click ended a long press
      return;
    }
    closePicker();
    onToggle(shown ?? QUICK_REACTION);
  };

  const handleSelect = (type: ReactionType) => {
    onToggle(type);
    // Single: picking is final. Multi: stay open to toggle several.
    if (policy === "single") closePicker();
  };

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleQuickClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
        disabled={disabled}
        aria-pressed={shown !== null}
        aria-label={
          shown
            ? `${REACTIONS[shown].label} — click to remove`
            : REACTIONS[QUICK_REACTION].label
        }
        className={cn(
          "flex items-center rounded-md font-medium transition-colors select-none disabled:opacity-50",
          SIZE[size],
          shown ? "text-primary-600" : "text-gray-500 hover:text-primary-600",
        )}
      >
        {shown ? (
          <span aria-hidden className={size === "sm" ? "text-sm" : "text-lg"}>
            {REACTIONS[shown].emoji}
          </span>
        ) : (
          <Icon name="thumbsUp" size={size === "sm" ? "small" : "medium"} />
        )}
        <span>{REACTIONS[shown ?? QUICK_REACTION].label}</span>
      </button>

      <button
        type="button"
        onClick={() => (open ? closePicker() : openPicker(true, false))}
        disabled={disabled}
        aria-label="Choose a reaction"
        aria-haspopup="true"
        aria-expanded={open}
        title="Choose a reaction"
        className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
      >
        <Icon name="smilePlus" size="small" />
      </button>

      {open && (
        <ReactionPicker
          mine={summary.mine}
          onSelect={handleSelect}
          onClose={closePicker}
          autoFocus={focusOnOpen}
          disabled={disabled}
          placement={placement}
          align={align}
          boundaryRef={wrapperRef}
        />
      )}
    </div>
  );
}
