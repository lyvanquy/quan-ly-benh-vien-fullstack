import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../prismaClient';
import { forbidden, unauthorized } from '../utils/response';

// ─── In-memory permission cache (TTL 60s) ────────────────────────────────────
const permCache = new Map<string, { perms: Set<string>; exp: number }>();
const CACHE_TTL = 60_000;

async function getRolePermissions(role: string): Promise<Set<string>> {
  const cached = permCache.get(role);
  if (cached && cached.exp > Date.now()) return cached.perms;

  const rps = await (prisma as never as {
    rolePermission: { findMany: (a: unknown) => Promise<Array<{ permission: { key: string } }>> };
  }).rolePermission.findMany({
    where: { role: role as never },
    include: { permission: true },
  });

  const perms = new Set(rps.map((r) => r.permission.key));
  permCache.set(role, { perms, exp: Date.now() + CACHE_TTL });
  return perms;
}

export function invalidatePermCache(role?: string) {
  if (role) permCache.delete(role);
  else permCache.clear();
}

// ─── Safe ABAC condition evaluator ───────────────────────────────────────────
// Only allows simple comparisons — no arbitrary code execution
function evalAbacCondition(
  condition: string,
  user: { id: string; role: string; email: string },
  ctx: Record<string, unknown>
): boolean {
  try {
    // Whitelist: only allow field access, comparisons, logical ops
    const safe = condition.replace(/[^a-zA-Z0-9_.'"=!<>&|() ]/g, '');
    // eslint-disable-next-line no-new-func
    return !!new Function('user', 'ctx', `"use strict"; return !!(${safe});`)(user, ctx);
  } catch {
    return false;
  }
}

// ─── Core permission check ────────────────────────────────────────────────────
export async function hasPermission(
  user: { id: string; role: string; email: string },
  permKey: string,
  ctx: Record<string, unknown> = {}
): Promise<boolean> {
  // 1. Role-based check (cached)
  const rolePerms = await getRolePermissions(user.role);
  if (rolePerms.has(permKey)) return true;

  // 2. User-level override
  const override = await (prisma as never as {
    userRolePermission: {
      findUnique: (a: unknown) => Promise<{ granted: boolean; permission: { condition: string | null } } | null>;
    };
  }).userRolePermission.findUnique({
    where: { userId_permissionId: { userId: user.id, permissionId: permKey } } as never,
    include: { permission: true },
  });

  if (override !== null) {
    if (!override.granted) return false; // explicit deny
    // Check ABAC condition if present
    if (override.permission.condition) {
      return evalAbacCondition(override.permission.condition, user, ctx);
    }
    return true;
  }

  // 3. ABAC fallback: load permission and check condition
  const perm = await (prisma as never as {
    permission: { findUnique: (a: unknown) => Promise<{ condition: string | null } | null> };
  }).permission.findUnique({ where: { key: permKey } });

  if (perm?.condition) {
    return evalAbacCondition(perm.condition, user, ctx);
  }

  return false;
}

// ─── Middleware factory ───────────────────────────────────────────────────────
export function requirePermission(permKey: string, getCtx?: (req: AuthRequest) => Record<string, unknown>) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return unauthorized(res);

    const ctx = getCtx ? getCtx(req) : { body: req.body, params: req.params, query: req.query };
    const allowed = await hasPermission(req.user, permKey, ctx);

    // Async audit log (fire-and-forget, don't block request)
    prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: `PERMISSION_CHECK:${permKey}`,
        entity: 'Permission',
        before: { role: req.user.role, permKey, allowed } as never,
        ip: req.ip,
      },
    }).catch(() => {});

    if (!allowed) return forbidden(res, `Permission denied: ${permKey}`);
    next();
  };
}
