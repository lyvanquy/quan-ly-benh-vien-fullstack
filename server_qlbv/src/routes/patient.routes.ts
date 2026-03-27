import { Router } from 'express';
import { getPatients, getPatient, createPatient, updatePatient, deletePatient } from '../controllers/patient.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getPatients);
router.get('/:id', getPatient);
router.post('/', authorize('ADMIN', 'RECEPTIONIST', 'NURSE'), createPatient);
router.put('/:id', authorize('ADMIN', 'RECEPTIONIST', 'NURSE'), updatePatient);
router.delete('/:id', authorize('ADMIN'), deletePatient);

export default router;
