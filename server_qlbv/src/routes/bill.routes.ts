import { Router } from 'express';
import { getBills, getBill, createBill, updateBillStatus } from '../controllers/bill.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getBills);
router.get('/:id', getBill);
router.post('/', authorize('ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'), createBill);
router.patch('/:id/status', authorize('ADMIN', 'ACCOUNTANT'), updateBillStatus);

export default router;
