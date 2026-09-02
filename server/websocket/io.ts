import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../types";
import { rooms } from "../types";

export type AppServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type EventName = keyof ServerToClientEvents;
type EventArgs<E extends EventName> = Parameters<ServerToClientEvents[E]>;

let io: AppServer | null = null;

/** Called once from index.ts after the Socket.IO server is created. */
export function setIO(server: AppServer): void {
  io = server;
}

// Every helper is a no-op when no server is registered (scripts, tests).

/** Emit to one user's personal room (every tab/device they have open). */
export function emitToUser<E extends EventName>(
  userId: number,
  event: E,
  ...args: EventArgs<E>
): void {
  io?.to(rooms.user(userId)).emit(event, ...args);
}

export function emitToUsers<E extends EventName>(
  userIds: readonly number[],
  event: E,
  ...args: EventArgs<E>
): void {
  if (userIds.length === 0) return;
  io?.to(userIds.map((id) => rooms.user(id))).emit(event, ...args);
}

/** Emit to every connected socket. */
export function broadcast<E extends EventName>(
  event: E,
  ...args: EventArgs<E>
): void {
  io?.emit(event, ...args);
}
