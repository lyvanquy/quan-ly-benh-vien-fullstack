import { Router } from 'express';
import * as sc from '../controllers/surgery.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('patient.view'), sc.getSurgeries);
router.get('/operating-rooms', requirePermission('patient.view'), sc.getOperatingRooms);
router.get('/:id', requirePermission('patient.view'), sc.getSurgery);
router.post('/', requirePermission('surgery.schedule'), sc.createSurgery);
router.put('/:id', requirePermission('surgery.update'), sc.updateSurgery);

export default router;
