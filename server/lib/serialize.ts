import type { Model } from "sequelize";

/**
 * Turn a model instance into exactly what `res.json()` would send: Dates
 * become ISO strings, `toJSON()` overrides apply, includes are nested.
 * Used for socket payloads so HTTP and WebSocket consumers see one shape.
 */
export function toWire<T>(instance: Model): T {
  return JSON.parse(JSON.stringify(instance)) as T;
}
