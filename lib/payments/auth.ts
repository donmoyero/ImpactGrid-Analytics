import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/** True if the request carries `Authorization: Bearer <process.env[envName]>`. Fails closed if the env var is unset. */
export function hasBearer(req: NextRequest, envName: string): boolean {
  const expected = process.env[envName];
  if (!expected) return false;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
