import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { ok, created, notFound, serverError, badRequest } from '../utils/response';

const sp = () => prisma as never as {
  surgery: {
    findMany: (a: unknown) => Promise<unknown[]>;
    findUnique: (a: unknown) => Promise<unknown>;
    create: (a: unknown) => Promise<unknown>;
    update: (a: unknown) => Promise<unknown>;
    count: (a: unknown) => Promise<number>;
  };
  operatingRoom: { findMany: (a: unknown) => Promise<unknown[]> };
};

export const getSurgeries = async (req: Request, res: Response) => {
  try {
    const { date, status } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (date) {
      const d = new Date(date); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.scheduledStart = { gte: d, lt: next };
    }
    const surgeries = await sp().surgery.findMany({
      where,
      include: {
        patient: { select: { name: true, patientCode: true } },
        surgeon: { include: { user: { select: { name: true } } } },
        or: true,
      },
      orderBy: { scheduledStart: 'asc' },
    });
    return ok(res, surgeries);
  } catch { return serverError(res); }
};

export const getSurgery = async (req: Request, res: Response) => {
  try {
    const surgery = await sp().surgery.findUnique({
      where: { id: req.params.id },
      include: {
        patient: { select: { id: true, name: true, patientCode: true } },
        surgeon: { include: { user: { select: { name: true } } } },
        or: true,
      },
    });
    if (!surgery) return notFound(res, 'Surgery not found');
    return ok(res, surgery);
  } catch { return serverError(res); }
};

export const createSurgery = async (req: Request, res: Response) => {
  try {
    // Check OR availability
    const { orId, scheduledStart, scheduledEnd } = req.body;
    const conflict = await sp().surgery.count({
      where: {
        orId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        OR: [
          { scheduledStart: { lte: new Date(scheduledStart) }, scheduledEnd: { gte: new Date(scheduledStart) } },
          { scheduledStart: { lte: new Date(scheduledEnd) }, scheduledEnd: { gte: new Date(scheduledEnd) } },
        ],
      },
    });
    if (conflict > 0) return badRequest(res, 'Phòng mổ đã có lịch trong khung giờ này');

    const surgery = await sp().surgery.create({
      data: req.body,
      include: {
        patient: { select: { name: true } },
        surgeon: { include: { user: { select: { name: true } } } },
        or: true,
      },
    });
    return created(res, surgery);
  } catch { return serverError(res); }
};

export const updateSurgery = async (req: Request, res: Response) => {
  try {
    const surgery = await sp().surgery.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, surgery);
  } catch { return serverError(res); }
};

export const getOperatingRooms = async (_req: Request, res: Response) => {
  try {
    const ors = await sp().operatingRoom.findMany({ include: { room: { include: { ward: true } } } });
    return ok(res, ors);
  } catch { return serverError(res); }
};
