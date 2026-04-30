import { Router } from 'express';
import * as inspectionController from '../controllers/inspection.controller';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import {
  createInspectionSchema,
  inspectionIdParamsSchema,
} from '../schemas/inspection.schema';

const router = Router();

router.get('/list', authMiddleware, inspectionController.listInspections);
// MEDIUM #22: Zod schemas added — previously these endpoints accepted any
// JSON body / id without validation.
router.post(
  '/create',
  authMiddleware,
  validateRequest(createInspectionSchema),
  inspectionController.createInspection,
);
router.get(
  '/:id',
  authMiddleware,
  validateRequest(inspectionIdParamsSchema),
  inspectionController.getInspection,
);
router.delete(
  '/:id',
  authMiddleware,
  validateRequest(inspectionIdParamsSchema),
  inspectionController.deleteInspection,
);

export default router;
