import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { ok, serverError } from '../utils/response';

const bedPrisma = () => prisma as never as {
  campus: { findMany: (a: unknown) => Promise<unknown[]> };
  ward: { findMany: (a: unknown) => Promise<unknown[]> };
  bed: { findMany: (a: unknown) => Promise<unknown[]>; update: (a: unknown) => Promise<unknown>; count: (a: unknown) => Promise<number> };
};

export const getBedMap = async (_req: Request, res: Response) => {
  try {
    const bp = bedPrisma();
    const wards = await bp.ward.findMany({
      include: {
        rooms: {
          include: {
            beds: true,
          },
        },
        floor: { include: { building: { include: { campus: true } } } },
      },
    });
    return ok(res, wards);
  } catch { return serverError(res); }
};

export const getAvailableBeds = async (req: Request, res: Response) => {
  try {
    const { wardId } = req.query as Record<string, string>;
    const bp = bedPrisma();
    const beds = await bp.bed.findMany({
      where: { status: 'AVAILABLE', ...(wardId ? { room: { wardId } } : {}) },
      include: { room: { include: { ward: true } } },
    });
    return ok(res, beds);
  } catch { return serverError(res); }
};

export const getBedStats = async (_req: Request, res: Response) => {
  try {
    const bp = bedPrisma();
    const [total, available, occupied, reserved, maintenance] = await Promise.all([
      bp.bed.count({}),
      bp.bed.count({ where: { status: 'AVAILABLE' } }),
      bp.bed.count({ where: { status: 'OCCUPIED' } }),
      bp.bed.count({ where: { status: 'RESERVED' } }),
      bp.bed.count({ where: { status: 'MAINTENANCE' } }),
    ]);
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return ok(res, { total, available, occupied, reserved, maintenance, occupancyRate });
  } catch { return serverError(res); }
};

export const updateBedStatus = async (req: Request, res: Response) => {
  try {
    const bp = bedPrisma();
    const bed = await bp.bed.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    return ok(res, bed);
  } catch { return serverError(res); }
};
