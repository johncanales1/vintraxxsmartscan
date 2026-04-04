import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import logger from '../utils/logger';

export interface AdminJwtPayload {
  adminId: string;
  email: string;
  role: 'admin';
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
