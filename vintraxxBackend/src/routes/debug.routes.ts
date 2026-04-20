import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { uploadClientLog } from '../controllers/debug.controller';

const router = Router();

// POST /api/v1/debug/client-log — upload batched mobile log entries (auth required)
router.post('/client-log', authMiddleware, uploadClientLog);

export default router;
