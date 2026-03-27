import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as c from '../controllers/notification.controller';

const router = Router();
router.use(authenticate);

router.get('/', c.getMyNotifications);
router.put('/read-all', c.markAllRead);
router.put('/:id/read', c.markRead);

export default router;
