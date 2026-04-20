import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Attaches a correlation ID to every incoming request.
 *
 * Reads the inbound `X-Request-Id` header (from the mobile client) or generates
 * a fresh UUID. The ID is exposed via `req.requestId`, stored in `res.locals`,
 * and echoed back on the response so clients can correlate logs end-to-end.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const inbound = req.header('X-Request-Id') || req.header('x-request-id');
  const requestId = inbound && inbound.length > 0 && inbound.length <= 128 ? inbound : randomUUID();
  req.requestId = requestId;
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
