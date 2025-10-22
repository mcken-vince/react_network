import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { Response, NextFunction } from "express";
import type { AuthRequest, JWTPayload } from "../types";

dotenv.config();

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }

    const payload = decoded as JWTPayload;
    req.userId = payload.userId;
    req.user = {
      id: payload.userId.toString(),
      username: payload.username || "",
      email: payload.email || "",
    };

    next();
  });
};
