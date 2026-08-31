import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export interface JWTPayload {
  userId: number;
}

const TOKEN_TTL = "7d";
const DEV_FALLBACK_SECRET = "dev-only-insecure-secret";

function resolveSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }
  console.warn(
    "[jwt] JWT_SECRET not set — using insecure development fallback",
  );
  return DEV_FALLBACK_SECRET;
}

const SECRET = resolveSecret();

export function signToken(userId: number): string {
  const payload: JWTPayload = { userId };
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_TTL });
}

function isJWTPayload(value: unknown): value is JWTPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).userId === "number"
  );
}

/** Throws (jsonwebtoken errors or Error) on invalid/expired/malformed tokens. */
export function verifyToken(token: string): JWTPayload {
  const decoded = jwt.verify(token, SECRET);
  if (!isJWTPayload(decoded)) {
    throw new Error("Invalid token payload");
  }
  return { userId: decoded.userId };
}

/** Pull the bearer token out of an `Authorization` header value. */
export function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}
