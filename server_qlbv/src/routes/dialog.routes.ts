import { Router } from 'express';
import * as dc from '../controllers/dialog.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

// Flow CRUD (admin only)
router.get('/', dc.getFlows);
router.get('/sessions', dc.getSessions);
router.post('/', authorize('ADMIN'), dc.createFlow);
router.put('/:id', authorize('ADMIN'), dc.updateFlow);
router.delete('/:id', authorize('ADMIN'), dc.deleteFlow);

// Flow runtime (by key)
router.get('/:key', dc.getFlow);
router.post('/:key/start', dc.startSession);
router.post('/:key/next', dc.nextNode);
router.get('/session/:sessionId', dc.getSession);

export default router;
