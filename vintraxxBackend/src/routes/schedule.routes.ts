import { Router } from 'express';
import { submitScheduleRequest } from '../controllers/schedule.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// POST /api/v1/schedule/submit - Submit a service appointment request (requires auth)
router.post('/submit', authMiddleware, submitScheduleRequest);

export default router;
