import { Router } from 'express';
import { getPatientTimeline } from '../controllers/timeline.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/patient/:patientId', getPatientTimeline);
export default router;
