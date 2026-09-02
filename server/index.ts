import "reflect-metadata";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { QueryTypes } from "sequelize";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import connectionRoutes from "./routes/connections";
import notificationRoutes from "./routes/notifications";
import postRoutes from "./routes/posts";
import messageRoutes from "./routes/messages";
import { errorHandler } from "./middleware/errorHandler";
import { sequelize } from "./models";
import { sendError } from "./utils/responses";
import { setupWebSocketHandlers } from "./websocket/handlers";
import { authenticateSocket } from "./websocket/middleware";
import { setIO } from "./websocket/io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./types";

dotenv.config();

const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";

const app = express();
const httpServer = createServer(app);

// ---------------------------------------------------------------------------
// Socket.IO
// ---------------------------------------------------------------------------

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: { origin: CLIENT_URL, credentials: true },
  transports: ["websocket", "polling"],
});
setIO(io);

io.use(authenticateSocket);
io.on("connection", (socket) => {
  console.log(`WebSocket connected: ${socket.id} (user ${socket.data.userId})`);
  setupWebSocketHandlers(socket);
});

// ---------------------------------------------------------------------------
// HTTP middleware
// ---------------------------------------------------------------------------

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: CLIENT_URL, credentials: true }));

// General API: generous enough for a React Query SPA on a shared office IP.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later" },
  }),
);
// Auth endpoints: tight, to slow credential stuffing.
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts, please try again later" },
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/posts", postRoutes);
app.use("/api", messageRoutes); // /api/conversations/*, /api/messages/*

interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  database: "connected" | "disconnected";
  dbTime?: string;
  websocketClients?: number;
  error?: string;
}

app.get("/api/health", async (_req, res) => {
  const timestamp = new Date().toISOString();
  try {
    const rows = await sequelize.query<{ now: Date }>("SELECT NOW() AS now", {
      type: QueryTypes.SELECT,
    });
    res.json({
      status: "ok",
      timestamp,
      database: "connected",
      dbTime: rows[0]?.now.toISOString(),
      websocketClients: io.engine.clientsCount,
    } satisfies HealthResponse);
  } catch (error) {
    res.status(500).json({
      status: "error",
      timestamp,
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    } satisfies HealthResponse);
  }
});

// 404 must come before the error handler.
app.use((_req, res) => {
  sendError(res, 404, "Route not found");
});
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

function shutdown(signal: NodeJS.Signals): void {
  console.log(`\n${signal} received — shutting down gracefully...`);

  // Stop accepting new connections, drop sockets, then release the DB pool.
  httpServer.close(() => {
    io.close(() => {
      sequelize
        .close()
        .then(() => {
          console.log("Shutdown complete");
          process.exit(0);
        })
        .catch((error: unknown) => {
          console.error("Error closing database connection:", error);
          process.exit(1);
        });
    });
  });

  // Don't hang forever on stuck keep-alive connections.
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready (client origin: ${CLIENT_URL})`);
});
