import type { ErrorRequestHandler } from "express";
import { sendError } from "../utils/responses";

interface HttpError {
  message?: string;
  stack?: string;
  /** Set by body-parser (e.g. "entity.parse.failed"). */
  type?: string;
  status?: number;
  statusCode?: number;
}

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req,
  res,
  _next,
) => {
  const e: HttpError =
    typeof err === "object" && err !== null ? (err as HttpError) : {};

  if (e.type === "entity.parse.failed") {
    sendError(res, 400, "Invalid JSON in request body");
    return;
  }
  if (e.type === "entity.too.large") {
    sendError(res, 413, "Request entity too large");
    return;
  }

  const status = e.status ?? e.statusCode ?? 500;
  if (status >= 500) {
    console.error(e.stack ?? err);
    sendError(res, status, "Something went wrong!");
    return;
  }
  sendError(res, status, e.message || "Request failed");
};
