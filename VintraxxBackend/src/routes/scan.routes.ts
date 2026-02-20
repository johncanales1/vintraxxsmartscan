import { Router } from 'express';
import * as scanController from '../controllers/scan.controller';
import { authMiddleware } from '../middleware/auth';
import { scanRateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import { scanSubmissionSchema, scanReportParamsSchema } from '../schemas/scan.schema';

const router = Router();

router.use(authMiddleware);

router.post('/submit', scanRateLimiter, validateRequest(scanSubmissionSchema), scanController.submitScan);
router.get('/report/:scanId', validateRequest(scanReportParamsSchema), scanController.getReport);
router.get('/history', scanController.getHistory);

export default router;
