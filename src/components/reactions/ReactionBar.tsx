import { REACTIONS } from "@shared/reactions";
import { Icon } from "../atoms";
import { cn } from "../../lib/cn";
import { rankedReactions } from "../../lib/reactions";
import type { ReactionSummary, ReactionType } from "../../types";

interface ReactionBarProps {
  summary: ReactionSummary;
  /** Clicking a chip toggles that reaction for the viewer. */
  onToggle: (type: ReactionType) => void;
  /** Renders a "who reacted" button when provided. */
  onShowReactors?: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/** Count chips, most popular first. Renders nothing until someone reacts. */
export default function ReactionBar({
  summary,
  onToggle,
  onShowReactors,
  disabled = false,
  size = "md",
  className,
}: ReactionBarProps) {
  if (summary.total === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {rankedReactions(summary).map(({ type, count }) => {
        const mine = summary.mine.includes(type);
        const label = `${REACTIONS[type].label}: ${count}${mine ? " (including you)" : ""}`;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onToggle(type)}
            disabled={disabled}
            aria-pressed={mine}
            aria-label={label}
            title={label}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border transition-colors disabled:opacity-50",
              size === "sm" ? "px-1.5 text-xs" : "px-2 py-0.5 text-sm",
              mine
                ? "border-primary-300 bg-primary-50 text-primary-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
            )}
          >
            <span aria-hidden>{REACTIONS[type].emoji}</span>
            <span>{count}</span>
          </button>
        );
      })}
      {onShowReactors && (
        <button
          type="button"
          onClick={onShowReactors}
          aria-label="See who reacted"
          title="See who reacted"
          className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <Icon name="users" size="small" />
        </button>
      )}
    </div>
  );
}
