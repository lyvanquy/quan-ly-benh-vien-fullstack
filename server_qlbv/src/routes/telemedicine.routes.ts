import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as c from '../controllers/telemedicine.controller';

const router = Router();
router.use(authenticate);

router.get('/', c.getTeleConsults);
router.get('/:id', c.getTeleConsult);
router.post('/', c.createTeleConsult);
router.put('/:id', c.updateTeleConsult);
router.post('/:id/start', c.startSession);
router.post('/:id/end', c.endSession);

export default router;
