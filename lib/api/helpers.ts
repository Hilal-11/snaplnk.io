// lib/api/helpers.ts
// Small shared helpers for route handlers. Keep error messages generic: never
// forward raw database / provider errors to the client.
import type { ZodError } from "zod";

export function jsonError(
  status: number,
  error: string,
  init?: { headers?: Record<string, string>; details?: Record<string, unknown> }
): Response {
  return Response.json(
    { error, ...(init?.details ? { details: init.details } : {}) },
    { status, headers: init?.headers }
  );
}

export type ReadJsonResult<T = unknown> = { ok: true; data: T } | { ok: false; response: Response };

/** Parses a JSON object body. Rejects non-objects and oversized payloads. */
export async function readJson(
  request: Request,
  opts: { maxBytes?: number } = {}
): Promise<ReadJsonResult> {
  const maxBytes = opts.maxBytes ?? 256 * 1024;
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return { ok: false, response: jsonError(413, "Request body too large") };

  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, response: jsonError(400, "Invalid request body") };
  }
  if (new TextEncoder().encode(text).length > maxBytes) {
    return { ok: false, response: jsonError(413, "Request body too large") };
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, response: jsonError(400, "Invalid JSON body") };
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, response: jsonError(400, "Request body must be a JSON object") };
  }
  return { ok: true, data };
}

export function clampInt(value: string | null, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

/** Flattens a ZodError into `{ "path.to.field": ["message", ...] }`. */
export function formatZodError(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.map(String).join(".") : "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
