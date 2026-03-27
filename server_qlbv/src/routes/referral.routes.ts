import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as c from '../controllers/referral.controller';

const router = Router();
router.use(authenticate);

router.get('/', c.getReferrals);
router.get('/:id', c.getReferral);
router.post('/', c.createReferral);
router.put('/:id', c.updateReferral);
router.delete('/:id', c.deleteReferral);

export default router;
