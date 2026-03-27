import { Router } from 'express';
import * as pc from '../controllers/pharmacy.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

router.get('/medicines', pc.getMedicines);
router.post('/medicines', authorize('ADMIN', 'PHARMACIST'), pc.createMedicine);
router.put('/medicines/:id', authorize('ADMIN', 'PHARMACIST'), pc.updateMedicine);
router.post('/medicines/:id/stock', authorize('ADMIN', 'PHARMACIST'), pc.adjustStock);
router.post('/prescriptions/:prescriptionId/dispense', authorize('ADMIN', 'PHARMACIST'), pc.dispensePrescription);
router.get('/alerts/low-stock', pc.getLowStockAlerts);

export default router;
