import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "./env";
import type { ClientToServerEvents, ServerToClientEvents } from "../types";

export type AppClientSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

let socket: AppClientSocket | null = null;
let currentToken: string | null = null;

/**
 * Create (or reuse) the singleton socket, authenticated with the JWT from the
 * handshake. Reconnecting with a new token tears the old socket down first.
 */
export function connectSocket(token: string): AppClientSocket {
  if (socket && currentToken === token) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function getSocket(): AppClientSocket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  currentToken = null;
}
