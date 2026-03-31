import { Router } from 'express';
import * as dealerController from '../controllers/dealer.controller';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { authRateLimiter } from '../middleware/rateLimiter';
import { z } from 'zod';

const router = Router();

const dealerLoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const dealerUpdateSchema = z.object({
  body: z.object({
    pricePerLaborHour: z.number().positive().optional(),
    logoImage: z.string().optional(),
  }),
});

// Public: dealer portal login
router.post('/login', authRateLimiter, validateRequest(dealerLoginSchema), dealerController.dealerLogin);

// Protected: dealer profile & reports
router.get('/profile', authMiddleware, dealerController.getDealerProfile);
router.put('/profile', authMiddleware, validateRequest(dealerUpdateSchema), dealerController.updateDealerProfile);
router.get('/reports', authMiddleware, dealerController.getDealerReports);

// Dashboard: OBD scan history with statistics
router.get('/scan-history', authMiddleware, dealerController.getDealerScanHistory);

// Dashboard: single report detail
router.get('/report/:scanId', authMiddleware, dealerController.getDealerReportDetail);

export default router;
