import type { AppSocket } from "./io";
import { BadRequestError, HttpError } from "../lib/errors";
import { isUuid } from "../utils/validation";

/**
 * Run a socket action. Known errors become an `error` event with the HTTP
 * status as `code`; unknown errors are logged and reported generically.
 */
export async function guard(
  socket: AppSocket,
  action: string,
  fn: () => Promise<unknown>,
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    if (error instanceof HttpError) {
      socket.emit("error", {
        message: error.message,
        code: String(error.status),
      });
      return;
    }
    console.error(
      `[socket] ${action} failed for user ${socket.data.userId}:`,
      error,
    );
    socket.emit("error", { message: `Failed to ${action}` });
  }
}

// Client payloads are typed by the event map but untrusted at runtime.

export function requireUuid(value: unknown, name: string): string {
  if (!isUuid(value)) throw new BadRequestError(`Invalid ${name}`);
  return value;
}

export function requirePositiveInt(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new BadRequestError(`Invalid ${name}`);
  }
  return value;
}

export function requireStringArray(value: unknown, name: string): string[] {
  if (
    !Array.isArray(value) ||
    !value.every((item): item is string => typeof item === "string")
  ) {
    throw new BadRequestError(`${name} must be an array of strings`);
  }
  return value;
}

export function requireIntArray(value: unknown, name: string): number[] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (item): item is number =>
        typeof item === "number" && Number.isInteger(item),
    )
  ) {
    throw new BadRequestError(`${name} must be an array of integers`);
  }
  return value;
}
