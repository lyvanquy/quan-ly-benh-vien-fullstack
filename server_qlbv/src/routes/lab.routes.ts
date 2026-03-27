import { Router } from 'express';
import * as lc from '../controllers/lab.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
router.use(authenticate);

router.get('/tests', lc.getLabTests);
router.post('/tests', requirePermission('admin.users'), lc.createLabTest);
router.get('/orders', requirePermission('lab.view_result'), lc.getLabOrders);
router.post('/orders', requirePermission('lab.create_order'), lc.createLabOrder);
router.patch('/orders/items/:itemId/result', requirePermission('lab.process'), lc.updateLabResult);

// Specimen tracking
router.post('/specimens', requirePermission('lab.process'), lc.createSpecimen);
router.patch('/specimens/:id/status', requirePermission('lab.process'), lc.updateSpecimenStatus);

export default router;
