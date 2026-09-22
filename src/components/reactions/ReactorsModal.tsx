import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { REACTIONS } from "@shared/reactions";
import { Avatar } from "../common";
import { Icon } from "../atoms";
import { cn } from "../../lib/cn";
import { rankedReactions, type ReactionTargetRef } from "../../lib/reactions";
import { useReactors } from "../../hooks/useReactions";
import type { ReactionSummary, ReactionType } from "../../types";

interface ReactorsModalProps {
  target: ReactionTargetRef;
  summary: ReactionSummary;
  onClose: () => void;
}

const tabClass = (active: boolean): string =>
  cn(
    "flex items-center gap-1 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "border-primary-600 text-primary-600"
      : "border-transparent text-gray-500 hover:text-gray-700",
  );

export default function ReactorsModal({
  target,
  summary,
  onClose,
}: ReactorsModalProps) {
  const [activeType, setActiveType] = useState<ReactionType | undefined>(
    undefined,
  );
  const query = useReactors(target, activeType);
  const reactors = query.data?.pages.flatMap((p) => p.reactors) ?? [];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reactors-title"
          className="pointer-events-auto w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2
              id="reactors-title"
              className="text-lg font-semibold text-gray-900"
            >
              Reactions
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <Icon name="close" size="medium" />
            </button>
          </div>

          <div
            role="tablist"
            className="flex overflow-x-auto border-b border-gray-200 px-2"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeType === undefined}
              onClick={() => setActiveType(undefined)}
              className={tabClass(activeType === undefined)}
            >
              All {summary.total}
            </button>
            {rankedReactions(summary).map(({ type, count }) => (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={activeType === type}
                aria-label={`${REACTIONS[type].label}: ${count}`}
                onClick={() => setActiveType(type)}
                className={tabClass(activeType === type)}
              >
                <span aria-hidden>{REACTIONS[type].emoji}</span>
                {count}
              </button>
            ))}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {query.isLoading ? (
              <p className="p-4 text-center text-sm text-gray-500">Loading…</p>
            ) : query.isError ? (
              <p className="p-4 text-center text-sm text-red-600">
                Couldn&apos;t load reactions.
              </p>
            ) : reactors.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">
                No reactions yet.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {reactors.map((reactor) => (
                  <li
                    key={reactor.id}
                    className="flex items-center gap-3 px-4 py-2"
                  >
                    <Avatar
                      firstName={reactor.user?.firstName}
                      lastName={reactor.user?.lastName}
                      size="small"
                    />
                    <div className="min-w-0 flex-1">
                      {reactor.user ? (
                        <>
                          <Link
                            to="/profile/$userId"
                            params={{ userId: String(reactor.userId) }}
                            onClick={onClose}
                            className="block truncate text-sm font-medium text-gray-900 hover:text-primary-600"
                          >
                            {reactor.user.firstName} {reactor.user.lastName}
                          </Link>
                          <span className="block truncate text-xs text-gray-500">
                            @{reactor.user.username}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">
                          Unknown user
                        </span>
                      )}
                    </div>
                    <span
                      role="img"
                      aria-label={REACTIONS[reactor.type].label}
                      title={REACTIONS[reactor.type].label}
                      className="text-xl"
                    >
                      {REACTIONS[reactor.type].emoji}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {query.hasNextPage && (
              <div className="p-2 text-center">
                <button
                  type="button"
                  onClick={() => void query.fetchNextPage()}
                  disabled={query.isFetchingNextPage}
                  className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
                >
                  {query.isFetchingNextPage ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
