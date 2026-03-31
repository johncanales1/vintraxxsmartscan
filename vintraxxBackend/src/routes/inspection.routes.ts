import { Router } from 'express';
import * as inspectionController from '../controllers/inspection.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/list', authMiddleware, inspectionController.listInspections);
router.post('/create', authMiddleware, inspectionController.createInspection);
router.get('/:id', authMiddleware, inspectionController.getInspection);
router.delete('/:id', authMiddleware, inspectionController.deleteInspection);

export default router;
