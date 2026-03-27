import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as c from '../controllers/equipment.controller';

const router = Router();
router.use(authenticate);

router.get('/', c.getEquipments);
router.get('/:id', c.getEquipment);
router.post('/', c.createEquipment);
router.put('/:id', c.updateEquipment);
router.delete('/:id', c.deleteEquipment);
router.post('/:id/maintenance', c.addMaintenanceLog);

export default router;
