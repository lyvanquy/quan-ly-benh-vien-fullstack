import { Router } from 'express';
import { getAppointments, getAppointment, createAppointment, updateAppointment, deleteAppointment, getTodayAppointments } from '../controllers/appointment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getAppointments);
router.get('/today', getTodayAppointments);
router.get('/:id', getAppointment);
router.post('/', createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
