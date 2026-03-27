import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import {
  getPermissions, createPermission, updatePermission, deletePermission,
  getRolePermissions, assignRolePermission, removeRolePermission,
  getMyPermissions, setUserPermission,
} from '../controllers/permission.controller';

const router = Router();
router.use(authenticate);

// Current user's permissions (any authenticated user)
router.get('/me', getMyPermissions);

// Admin-only permission management
router.get('/', authorize('ADMIN'), getPermissions);
router.post('/', authorize('ADMIN'), createPermission);
router.put('/:id', authorize('ADMIN'), updatePermission);
router.delete('/:id', authorize('ADMIN'), deletePermission);

// Role → Permission mapping
router.get('/roles', authorize('ADMIN'), getRolePermissions);
router.post('/roles', authorize('ADMIN'), assignRolePermission);
router.delete('/roles/:role/:permissionId', authorize('ADMIN'), removeRolePermission);

// User-level override
router.post('/users', authorize('ADMIN'), setUserPermission);

export default router;
