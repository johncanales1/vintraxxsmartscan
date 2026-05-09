import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import prisma from '../config/db';
import logger from '../utils/logger';

export interface AdminJwtPayload {
  adminId: string;
  email: string;
  role: 'admin';
  /**
   * Mirror of `Admin.superAdmin` at token-issue time. Lets gated middleware
   * (`requireSuperAdmin`) decide without a per-request DB hit. Tokens have a
   * 24h TTL — a demoted admin still holds super-admin until their token
   * expires, which is acceptable given the rarity of demotions and the cost
   * of mandatory revocation lists.
   */
  superAdmin?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminJwtPayload;
    }
  }
}

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Admin authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AdminJwtPayload;
    if (decoded.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Admin access required' });
      return;
    }
    req.admin = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid admin JWT token attempt');
    res.status(401).json({ success: false, error: 'Invalid or expired admin token' });
  }
}

/**
 * Gate destructive admin endpoints (terminal delete, 0x8105 control commands,
 * future factory-reset) behind the `superAdmin` flag. Must be mounted AFTER
 * `adminAuthMiddleware` so `req.admin` is populated.
 *
 * We verify against the DB (not the JWT claim alone) because `superAdmin` can
 * be promoted after a token was issued and before it expires. The profile
 * endpoint already returns fresh DB state so the frontend shows delete buttons,
 * but with a JWT-only check here the request would 403 until re-login. Since
 * this middleware only protects rare destructive operations, one lightweight
 * `findUnique` per call is acceptable.
 */
export async function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.admin) {
    res.status(401).json({ success: false, error: 'Admin authentication required' });
    return;
  }

  // Fast path: JWT already says superAdmin — trust it (24h TTL, unlikely stale
  // for demotion case; worst case a demoted admin keeps access until expiry,
  // same as before).
  if (req.admin.superAdmin) {
    next();
    return;
  }

  // Slow path: JWT doesn't carry superAdmin (old token issued before promotion).
  // Verify against the DB to avoid forcing a re-login.
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.adminId },
      select: { superAdmin: true },
    });
    if (admin?.superAdmin) {
      // Patch req.admin so downstream handlers can also see the correct value.
      req.admin.superAdmin = true;
      next();
      return;
    }
  } catch (err) {
    logger.error('requireSuperAdmin: DB lookup failed', { error: (err as Error).message });
    // Fall through to the 403 — better to deny than to crash.
  }

  logger.warn('requireSuperAdmin: insufficient privilege', {
    adminId: req.admin.adminId,
    email: req.admin.email,
    path: req.path,
  });
  res.status(403).json({ success: false, error: 'Super-admin privilege required' });
}
