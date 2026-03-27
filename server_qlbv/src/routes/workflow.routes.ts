import { Router } from 'express';
import * as wc from '../controllers/workflow.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

// Admin
router.get('/', wc.getWorkflows);
router.get('/sessions', wc.getSessions);
router.post('/', authorize('ADMIN'), wc.createWorkflow);
router.put('/positions', authorize('ADMIN'), wc.updateNodePositions);
router.put('/:id', authorize('ADMIN'), wc.updateWorkflow);
router.delete('/:id', authorize('ADMIN'), wc.deleteWorkflow);

// Runtime (by key)
router.get('/:key', wc.getWorkflow);
router.post('/:key/start', wc.startSession);
router.post('/:key/next', wc.nextNode);
router.get('/session/:sessionId', wc.getSession);

export default router;
