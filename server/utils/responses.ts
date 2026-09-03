import type { Response } from "express";
import type { ValidationError } from "sequelize";
import type { ErrorResponse } from "../../shared/types";
import type { FieldErrors } from "./validation";

/** Standard error envelope for any status. */
export function sendError(
  res: Response,
  status: number,
  error: string,
  errors?: FieldErrors,
): void {
  const body: ErrorResponse = errors ? { error, errors } : { error };
  res.status(status).json(body);
}

/** 400 for a Sequelize validation error, same envelope. */
export function sendSequelizeValidationError(
  res: Response,
  error: ValidationError,
): void {
  const errors: FieldErrors = {};
  for (const item of error.errors) {
    if (item.path) errors[item.path] = item.message;
  }
  sendError(res, 400, "Validation failed", errors);
}
