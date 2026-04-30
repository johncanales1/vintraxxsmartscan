import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
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
 */
export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.admin) {
    res.status(401).json({ success: false, error: 'Admin authentication required' });
    return;
  }
  if (!req.admin.superAdmin) {
    logger.warn('requireSuperAdmin: insufficient privilege', {
      adminId: req.admin.adminId,
      email: req.admin.email,
      path: req.path,
    });
    res.status(403).json({ success: false, error: 'Super-admin privilege required' });
    return;
  }
  next();
}
