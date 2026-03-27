import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { ok, created, serverError, notFound } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { invalidatePermCache } from '../middleware/permission.middleware';

const pp = () => prisma as never as {
  permission: {
    findMany: (a: unknown) => Promise<unknown[]>;
    findUnique: (a: unknown) => Promise<unknown>;
    create: (a: unknown) => Promise<unknown>;
    update: (a: unknown) => Promise<unknown>;
    delete: (a: unknown) => Promise<unknown>;
  };
  rolePermission: {
    findMany: (a: unknown) => Promise<unknown[]>;
    create: (a: unknown) => Promise<unknown>;
    delete: (a: unknown) => Promise<unknown>;
    deleteMany: (a: unknown) => Promise<unknown>;
  };
  userRolePermission: {
    findMany: (a: unknown) => Promise<unknown[]>;
    upsert: (a: unknown) => Promise<unknown>;
    delete: (a: unknown) => Promise<unknown>;
  };
};

// GET /api/permissions — list all permissions
export const getPermissions = async (_req: Request, res: Response) => {
  try {
    const perms = await pp().permission.findMany({ orderBy: { resource: 'asc' } });
    return ok(res, perms);
  } catch { return serverError(res); }
};

// POST /api/permissions — create permission
export const createPermission = async (req: Request, res: Response) => {
  try {
    const perm = await pp().permission.create({ data: req.body });
    return created(res, perm);
  } catch { return serverError(res); }
};

// PUT /api/permissions/:id — update permission
export const updatePermission = async (req: Request, res: Response) => {
  try {
    const perm = await pp().permission.update({ where: { id: req.params.id }, data: req.body });
    invalidatePermCache(); // clear all cache on permission change
    return ok(res, perm);
  } catch { return serverError(res); }
};

// DELETE /api/permissions/:id
export const deletePermission = async (req: Request, res: Response) => {
  try {
    await pp().permission.delete({ where: { id: req.params.id } });
    invalidatePermCache();
    return ok(res, null, 'Deleted');
  } catch { return serverError(res); }
};

// GET /api/permissions/roles — get role→permission mapping
export const getRolePermissions = async (_req: Request, res: Response) => {
  try {
    const rps = await pp().rolePermission.findMany({ include: { permission: true } });
    return ok(res, rps);
  } catch { return serverError(res); }
};

// POST /api/permissions/roles — assign permission to role
export const assignRolePermission = async (req: Request, res: Response) => {
  try {
    const { role, permissionId } = req.body;
    const rp = await pp().rolePermission.create({ data: { role, permissionId } });
    invalidatePermCache(role);
    return created(res, rp);
  } catch { return serverError(res); }
};

// DELETE /api/permissions/roles/:role/:permissionId
export const removeRolePermission = async (req: Request, res: Response) => {
  try {
    const { role, permissionId } = req.params;
    await pp().rolePermission.deleteMany({ where: { role: role as never, permissionId } });
    invalidatePermCache(role);
    return ok(res, null, 'Removed');
  } catch { return serverError(res); }
};

// GET /api/me/permissions — current user's effective permissions
export const getMyPermissions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return ok(res, []);
    const rps = await pp().rolePermission.findMany({
      where: { role: req.user.role as never },
      include: { permission: { select: { key: true } } },
    }) as Array<{ permission: { key: string } }>;

    const keys = rps.map((r) => r.permission.key);

    // Apply user-level overrides
    const overrides = await pp().userRolePermission.findMany({
      where: { userId: req.user.id },
      include: { permission: { select: { key: true } } },
    }) as Array<{ granted: boolean; permission: { key: string } }>;

    for (const o of overrides) {
      if (o.granted && !keys.includes(o.permission.key)) keys.push(o.permission.key);
      if (!o.granted) {
        const idx = keys.indexOf(o.permission.key);
        if (idx > -1) keys.splice(idx, 1);
      }
    }

    return ok(res, keys);
  } catch { return serverError(res); }
};

// POST /api/permissions/users — grant/deny permission to specific user
export const setUserPermission = async (req: Request, res: Response) => {
  try {
    const { userId, permissionId, granted } = req.body;
    const result = await pp().userRolePermission.upsert({
      where: { userId_permissionId: { userId, permissionId } } as never,
      update: { granted },
      create: { userId, permissionId, granted },
    });
    return ok(res, result);
  } catch { return serverError(res); }
};
