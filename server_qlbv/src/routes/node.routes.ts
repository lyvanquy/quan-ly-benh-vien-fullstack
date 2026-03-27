import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import * as nc from '../controllers/node.controller';

const router = Router();
router.use(authenticate);

// Node CRUD
router.get('/:id', nc.getNode);
router.put('/:id', authorize('ADMIN'), nc.updateNode);

// Options
router.post('/:id/options', authorize('ADMIN'), nc.addOption);

// Actions
router.post('/options/:id/actions', authorize('ADMIN'), nc.addAction);

export default router;

// Separate option/action routers (mounted separately in app.ts)
export const optionRouter = Router();
optionRouter.use(authenticate);
optionRouter.put('/:id', authorize('ADMIN'), nc.updateOption);
optionRouter.delete('/:id', authorize('ADMIN'), nc.deleteOption);
optionRouter.post('/:id/actions', authorize('ADMIN'), nc.addAction);

export const actionRouter = Router();
actionRouter.use(authenticate);
actionRouter.put('/:id', authorize('ADMIN'), nc.updateAction);
actionRouter.delete('/:id', authorize('ADMIN'), nc.deleteAction);
actionRouter.post('/:id/run', nc.runAction);
