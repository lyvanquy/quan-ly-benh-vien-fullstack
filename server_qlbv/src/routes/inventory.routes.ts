import { Router } from 'express';
import * as ic from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

router.get('/', ic.getItems);
router.post('/', authorize('ADMIN'), ic.createItem);
router.post('/:id/adjust', authorize('ADMIN'), ic.adjustInventory);

export default router;
