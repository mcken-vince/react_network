import "reflect-metadata";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import connectionRoutes from "./routes/connections.js";
import notificationRoutes from "./routes/notifications.js";
import postRoutes from "./routes/posts.js";
import messageRoutes from "./routes/messages.js";
import { errorHandler } from "./middleware/errorHandler";
import { sequelize } from "./models";
import { setupWebSocketHandlers } from "./websocket/handlers";
import { authenticateSocket } from "./websocket/middleware";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "./types";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize Socket.IO with TypeScript types
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Rate limiting
// General API: generous enough for a React Query SPA on a shared office IP.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

// Auth endpoints: tight, to slow credential stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later" },
});

app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/posts", postRoutes);
app.use("/api", messageRoutes);

// Health check with database connection status
app.get("/api/health", async (_req, res) => {
  try {
    const result = await sequelize.query("SELECT NOW()");
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      dbTime: (result as any)[0]?.[0]?.now || "unknown",
      websocket: io.engine.clientsCount,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// WebSocket authentication middleware
io.use(authenticateSocket);

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log(
    `New WebSocket connection: ${socket.id}, User: ${socket.data.userId}`,
  );

  // Set up WebSocket handlers
  setupWebSocketHandlers(io, socket);

  // Join user's personal room
  if (socket.data.userId) {
    socket.join(`user:${socket.data.userId}`);

    // Notify others that user is online
    socket.broadcast.emit("user:online", socket.data.userId);
  }

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`WebSocket disconnected: ${socket.id}`);

    if (socket.data.userId) {
      // Notify others that user is offline
      socket.broadcast.emit("user:offline", socket.data.userId);
    }
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use("*", (_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");

  // Close WebSocket connections
  io.close(() => {
    console.log("WebSocket server closed");
  });

  // Close database connection
  await sequelize.close();

  // Close HTTP server
  httpServer.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});

// Export for use in other modules
export { io };
