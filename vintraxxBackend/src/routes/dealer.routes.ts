import { Router } from 'express';
import * as dealerController from '../controllers/dealer.controller';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { authRateLimiter, dealerEmailRateLimiter } from '../middleware/rateLimiter';
import { sendDealerEmailSchema, scheduleAppointmentSchema } from '../schemas/dealer.schema';
import { z } from 'zod';

const router = Router();

const dealerLoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// MEDIUM #24: `email` was removed — dealers cannot self-change their email
// anymore. Admin-only via /admin/users/:id. See updateDealerProfile JSDoc.
const dealerUpdateSchema = z.object({
  body: z.object({
    pricePerLaborHour: z.number().positive().optional(),
    logoImage: z.string().optional(),
    originalLogoImage: z.string().optional(),
    qrCodeImage: z.string().optional(),
    password: z.string().optional(),
    fullName: z.string().optional(),
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

// Schedule service appointment (sends email to john@vintraxx.com)
// MEDIUM #22: Zod schema added — previously the controller destructured
// fields off req.body with no validation.
router.post(
  '/schedule-appointment',
  authMiddleware,
  validateRequest(scheduleAppointmentSchema),
  dealerController.scheduleAppointment,
);

// Send custom email from dealer portal
// CRITICAL #7: gate by auth + dealer-only check (in controller) + zod schema
// + per-IP rate limit. The previous mounting was authMiddleware-only, so any
// authenticated regular user could relay arbitrary HTML mail through SMTP.
router.post(
  '/send-email',
  authMiddleware,
  dealerEmailRateLimiter,
  validateRequest(sendDealerEmailSchema),
  dealerController.sendDealerEmail,
);

// Service appointment activity history
router.get('/appointments', authMiddleware, dealerController.getDealerAppointments);

// Mark appointment as completed
router.patch('/appointments/:id/complete', authMiddleware, dealerController.completeDealerAppointment);

export default router;
