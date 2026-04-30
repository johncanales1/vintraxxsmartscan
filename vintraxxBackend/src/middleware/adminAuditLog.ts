/**
 * adminAuditLog middleware — records every successful admin write to the
 * `AdminAuditLog` table.
 *
 * Mount AFTER `adminAuthMiddleware` and BEFORE the route handlers. The
 * middleware hooks `res.on('finish')` so the row is written ONLY after the
 * response has been flushed and only when the status code is 2xx — failed
 * writes are still useful audit but we record them with the actual status
 * code so the operator can distinguish.
 *
 * GETs are skipped — the table would explode with read traffic and they
 * carry no state change. Service-level audits (e.g. internal jobs that
 * bypass HTTP) should write directly via prisma.adminAuditLog.create().
 *
 * Errors inside the audit insert are swallowed and logged — admin writes
 * must NEVER fail because we couldn't record them.
 */

import type { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import logger from '../utils/logger';

const RECORDED_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Body keys we strip before persisting. Both for size (large blobs would
 * blow out the row) and for security (passwords / tokens / images).
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'passwordHash',
  'token',
  'authToken',
  'refreshToken',
  'apiKey',
  'authCode',
  'logo',          // base64 dealer logos
  'qrCodeImage',   // base64 QR codes
]);

/** Hard limit on serialised body size to keep rows reasonable. */
const MAX_BODY_BYTES = 4_000;

function sanitiseBody(input: unknown): unknown {
  if (input === null || input === undefined) return null;
  if (typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map(sanitiseBody);

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(k)) {
      out[k] = '[redacted]';
      continue;
    }
    out[k] = sanitiseBody(v);
  }
  return out;
}

/**
 * Best-effort target extraction from path/body. Most admin endpoints use
 * /api/v1/admin/<resource>/<id> shapes — we treat the second-to-last
 * segment as the resource type and the last as the id.
 */
function inferTarget(path: string, body: unknown): { type?: string; id?: string } {
  const parts = path.split('/').filter(Boolean);
  // Look for a UUID-shaped segment; the segment before it is the type.
  for (let i = parts.length - 1; i > 0; i--) {
    const seg = parts[i];
    if (/^[0-9a-f-]{36}$/i.test(seg)) {
      return { type: parts[i - 1], id: seg };
    }
  }
  // Fallback: a top-level id field in the body (e.g. POST /something with
  // { id: '...' }).
  if (body && typeof body === 'object' && 'id' in body) {
    const candidate = (body as { id?: unknown }).id;
    if (typeof candidate === 'string') {
      return { type: parts[parts.length - 1], id: candidate };
    }
  }
  return {};
}

export function adminAuditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!RECORDED_METHODS.has(req.method)) {
    return next();
  }

  // Capture request snapshot up-front — body may be mutated by downstream
  // controllers (and by error handlers) before `finish` fires.
  const startedAt = Date.now();
  const adminId = req.admin?.adminId ?? null;
  const method = req.method;
  const path = req.originalUrl ?? req.url;
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
    req.ip ||
    null;
  const userAgent = req.headers['user-agent']?.toString() ?? null;
  const sanitisedBody = sanitiseBody(req.body);
  const target = inferTarget(path, req.body);

  res.on('finish', () => {
    // Trim body if oversized.
    let payload: unknown = sanitisedBody;
    try {
      const serialised = JSON.stringify(payload);
      if (serialised && serialised.length > MAX_BODY_BYTES) {
        payload = { _truncated: true, bytes: serialised.length };
      }
    } catch {
      payload = { _unserialisable: true };
    }

    void prisma.adminAuditLog
      .create({
        data: {
          adminId,
          method,
          path,
          statusCode: res.statusCode,
          action: `${method} ${path.split('?')[0]}`,
          targetType: target.type ?? null,
          targetId: target.id ?? null,
          ip,
          userAgent,
          payload: payload as object,
          errorText: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null,
        },
      })
      .catch((err) => {
        // Audit-write failures must never break the user-facing request,
        // and they're rare enough that logging is enough.
        logger.warn('admin-audit insert failed (non-fatal)', {
          err: (err as Error).message,
          path,
          method,
          adminId,
        });
      });

    if (res.statusCode >= 400) {
      logger.info('admin write completed (failed)', {
        path,
        method,
        statusCode: res.statusCode,
        adminId,
        durationMs: Date.now() - startedAt,
      });
    }
  });

  next();
}
