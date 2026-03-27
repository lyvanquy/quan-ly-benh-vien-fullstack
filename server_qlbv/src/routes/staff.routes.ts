import { Router } from 'express';
import * as sc from '../controllers/staff.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

router.get('/', sc.getStaff);
router.post('/', authorize('ADMIN'), sc.createStaff);
router.get('/shifts', sc.getShifts);
router.post('/shifts', authorize('ADMIN'), sc.createShift);

export default router;
