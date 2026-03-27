import { Router } from 'express';
import * as ec from '../controllers/encounter.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('patient.view'), ec.getEncounters);
router.get('/:id', requirePermission('patient.view'), ec.getEncounter);
router.post('/', requirePermission('encounter.create'), ec.createEncounter);
router.put('/:id', requirePermission('encounter.update'), ec.updateEncounterStatus);
router.patch('/:id/status', requirePermission('encounter.update'), ec.updateEncounterStatus);
router.post('/allocate-bed', requirePermission('bed.allocate'), ec.allocateBed);
router.post('/:id/vitals', requirePermission('encounter.update'), ec.addVitals);
router.post('/:id/notes', requirePermission('medicalrecord.create'), ec.addNote);
router.post('/:id/diagnoses', requirePermission('medicalrecord.create'), ec.addDiagnosis);

export default router;
