import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getPolicies,
  createPolicy,
  getClaims,
  createClaim,
  updateClaimStatus,
} from '../controllers/insurance.controller';

const router = Router();
router.use(authenticate);

router.get('/policies', getPolicies);
router.post('/policies', createPolicy);
router.get('/claims', getClaims);
router.post('/claims', createClaim);
router.patch('/claims/:id/status', updateClaimStatus);

export default router;
