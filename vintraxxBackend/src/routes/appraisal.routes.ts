import { Router } from 'express';
import * as appraisalController from '../controllers/appraisal.controller';
import { authMiddleware } from '../middleware/auth';
import { scanRateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import {
  appraisalValuationSchema,
  appraisalEmailSchema,
  appraisalPdfSchema,
  appraisalDashboardSchema,
} from '../schemas/appraisal.schema';

const router = Router();

router.use(authMiddleware);

// AI-based vehicle market valuation
router.post('/valuate', scanRateLimiter, validateRequest(appraisalValuationSchema), appraisalController.valuateVehicle);

// Send appraisal summary via email
router.post('/email', validateRequest(appraisalEmailSchema), appraisalController.emailAppraisal);

// Generate PDF and send via email
router.post('/pdf', validateRequest(appraisalPdfSchema), appraisalController.pdfAppraisal);

// Dashboard: get all appraisals for user
router.get('/dashboard', appraisalController.listDashboardAppraisals);

// Dashboard: get single appraisal by ID
router.get('/dashboard/:appraisalId', validateRequest(appraisalDashboardSchema), appraisalController.getDashboardAppraisal);

export default router;
