import { Router } from 'express';
import * as bc from '../controllers/bed.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/map', bc.getBedMap);
router.get('/available', bc.getAvailableBeds);
router.get('/stats', bc.getBedStats);
router.patch('/:id/status', bc.updateBedStatus);

export default router;
