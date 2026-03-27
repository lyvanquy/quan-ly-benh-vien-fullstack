import { Router } from 'express';
import { getRecords, getRecord, createRecord } from '../controllers/medicalRecord.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getRecords);
router.get('/:id', getRecord);
router.post('/', authorize('ADMIN', 'DOCTOR', 'NURSE'), createRecord);

export default router;
