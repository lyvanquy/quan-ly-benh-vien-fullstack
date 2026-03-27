import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as c from '../controllers/consent.controller';

const router = Router();
router.use(authenticate);

router.get('/', c.getConsentForms);
router.get('/:id', c.getConsentForm);
router.post('/', c.createConsentForm);
router.put('/:id/sign', c.signConsentForm);
router.delete('/:id', c.deleteConsentForm);

export default router;
