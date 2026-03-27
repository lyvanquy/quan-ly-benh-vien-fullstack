import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as c from '../controllers/procurement.controller';

const router = Router();
router.use(authenticate);

router.get('/suppliers', c.getSuppliers);
router.post('/suppliers', c.createSupplier);
router.put('/suppliers/:id', c.updateSupplier);
router.delete('/suppliers/:id', c.deleteSupplier);

router.get('/orders', c.getPurchaseOrders);
router.get('/orders/:id', c.getPurchaseOrder);
router.post('/orders', c.createPurchaseOrder);
router.put('/orders/:id', c.updatePurchaseOrder);

export default router;
