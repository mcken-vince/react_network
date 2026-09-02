import { verifyToken } from "../lib/jwt";
import { User } from "../models";
import type { AppSocket } from "./io";

/**
 * Socket.IO connection middleware: verifies the JWT from the handshake and
 * populates socket.data. Rejected connections never reach the handlers.
 */
export async function authenticateSocket(
  socket: AppSocket,
  next: (err?: Error) => void,
): Promise<void> {
  const raw: unknown =
    socket.handshake.auth.token ?? socket.handshake.query.token;
  const token = typeof raw === "string" ? raw : undefined;

  if (!token) {
    next(new Error("Authentication error: No token provided"));
    return;
  }

  try {
    const { userId } = verifyToken(token);
    const user = await User.findByPk(userId, {
      attributes: ["id", "username"],
    });
    if (!user) {
      next(new Error("Authentication error: User not found"));
      return;
    }

    socket.data.userId = user.id;
    socket.data.username = user.username;
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication error: Invalid token"));
  }
}
