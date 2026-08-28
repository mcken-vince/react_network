import type { Response } from "express";

interface ValidationFailure {
  message: string;
  errors?: Record<string, string>;
}

/** 400 with the standard error envelope for a validateX() failure. */
export function sendValidationError(
  res: Response,
  failure: ValidationFailure,
): void {
  res.status(400).json({ error: failure.message, errors: failure.errors });
}

/** 400 for a Sequelize validation error, same envelope. */
export function sendSequelizeValidationError(res: Response, error: any): void {
  const errors: Record<string, string> = {};
  for (const item of error.errors ?? []) {
    if (item?.path) errors[item.path] = item.message;
  }
  res.status(400).json({ error: "Validation failed", errors });
}
