import {
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import { REACTIONS, REACTION_TYPES } from "@shared/reactions";
import { cn } from "../../lib/cn";
import type { ReactionType } from "../../types";

interface ReactionPickerProps {
  /** The viewer's current reactions — shown as selected. */
  mine: readonly ReactionType[];
  onSelect: (type: ReactionType) => void;
  onClose: () => void;
  /** Move focus into the picker when it opens (explicit opens, not hover). */
  autoFocus?: boolean;
  disabled?: boolean;
  placement?: "top" | "bottom";
  align?: "left" | "right";
  /**
   * Clicks inside this element don't count as "outside" (pass the wrapper
   * that also contains the trigger, so clicking the trigger can toggle).
   */
  boundaryRef?: RefObject<HTMLElement | null>;
}

export default function ReactionPicker({
  mine,
  onSelect,
  onClose,
  autoFocus = false,
  disabled = false,
  placement = "top",
  align = "left",
  boundaryRef,
}: ReactionPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) buttonRefs.current[0]?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const boundary = boundaryRef?.current ?? containerRef.current;
      if (boundary && !boundary.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, boundaryRef]);

  const moveFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const count = REACTION_TYPES.length;
    const current = buttonRefs.current.findIndex(
      (b) => b === document.activeElement,
    );
    const delta = event.key === "ArrowRight" ? 1 : -1;
    buttonRefs.current[(current + delta + count) % count]?.focus();
  };

  return (
    <div
      ref={containerRef}
      role="toolbar"
      aria-label="Choose a reaction"
      onKeyDown={moveFocus}
      className={cn(
        "absolute z-30 flex items-center gap-0.5 rounded-full border border-gray-200 bg-white px-1.5 py-1 shadow-lg animate-fade-in motion-reduce:animate-none",
        placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
        align === "right" ? "right-0" : "left-0",
      )}
    >
      {REACTION_TYPES.map((type, index) => {
        const selected = mine.includes(type);
        return (
          <button
            key={type}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(type)}
            title={REACTIONS[type].label}
            aria-label={REACTIONS[type].label}
            aria-pressed={selected}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-2xl leading-none transition-transform duration-150 hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:scale-100",
              selected && "bg-primary-100",
            )}
          >
            <span aria-hidden>{REACTIONS[type].emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
