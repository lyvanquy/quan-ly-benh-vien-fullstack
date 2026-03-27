import { Router } from 'express';
import { getMedicines, getMedicine, createMedicine, updateMedicine } from '../controllers/medicine.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getMedicines);
router.get('/:id', getMedicine);
router.post('/', authorize('ADMIN', 'NURSE'), createMedicine);
router.put('/:id', authorize('ADMIN', 'NURSE'), updateMedicine);

export default router;
