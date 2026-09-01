import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../types";
import { extractBearerToken, verifyToken } from "../lib/jwt";
import { sendError } from "../utils/responses";

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    sendError(res, 401, "Access token required");
    return;
  }

  try {
    req.userId = verifyToken(token).userId;
    next();
  } catch {
    sendError(res, 403, "Invalid or expired token");
  }
};
