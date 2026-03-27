import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { ok, created, notFound, serverError, badRequest } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

const encounterPrisma = () => prisma as never as {
  encounter: {
    findMany: (a: unknown) => Promise<unknown[]>;
    findUnique: (a: unknown) => Promise<unknown>;
    create: (a: unknown) => Promise<unknown>;
    update: (a: unknown) => Promise<unknown>;
    count: (a: unknown) => Promise<number>;
  };
  bed: { findUnique: (a: unknown) => Promise<{ id: string; status: string } | null>; update: (a: unknown) => Promise<unknown> };
  bedTransfer: { create: (a: unknown) => Promise<unknown> };
  vitalSign: { create: (a: unknown) => Promise<unknown>; findMany: (a: unknown) => Promise<unknown[]> };
  clinicalNote: { create: (a: unknown) => Promise<unknown>; findMany: (a: unknown) => Promise<unknown[]> };
  encounterDiagnosis: { create: (a: unknown) => Promise<unknown> };
};

export const getEncounters = async (req: Request, res: Response) => {
  try {
    const { patientId, status, type, page = '1', limit = '10' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (type) where.type = type;

    const ep = encounterPrisma();
    const [encounters, total] = await Promise.all([
      ep.encounter.findMany({
        where, skip, take: parseInt(limit),
        include: {
          patient: { select: { name: true, patientCode: true, phone: true } },
          bed: { include: { room: { include: { ward: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      ep.encounter.count({ where }),
    ]);
    return ok(res, { encounters, total });
  } catch { return serverError(res); }
};

export const getEncounter = async (req: Request, res: Response) => {
  try {
    const ep = encounterPrisma();
    const encounter = await ep.encounter.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        bed: { include: { room: { include: { ward: true } } } },
        vitals: { orderBy: { recordedAt: 'desc' } },
        notes: { orderBy: { createdAt: 'desc' } },
        diagnoses: true,
        orders: { orderBy: { orderedAt: 'desc' } },
      },
    });
    if (!encounter) return notFound(res, 'Encounter not found');
    return ok(res, encounter);
  } catch { return serverError(res); }
};

export const createEncounter = async (req: Request, res: Response) => {
  try {
    const ep = encounterPrisma();
    const encounter = await ep.encounter.create({
      data: req.body,
      include: { patient: { select: { name: true } } },
    });
    return created(res, encounter);
  } catch { return serverError(res); }
};

export const updateEncounterStatus = async (req: Request, res: Response) => {
  try {
    const ep = encounterPrisma();
    const { status, dischargeNote } = req.body;
    const encounter = await ep.encounter.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(status === 'DISCHARGED' ? { dischargeDate: new Date(), dischargeNote } : {}),
        ...(status === 'ADMITTED' ? { admitDate: new Date() } : {}),
      },
    });
    return ok(res, encounter);
  } catch { return serverError(res); }
};

// Bed allocation with advisory lock simulation via transaction
export const allocateBed = async (req: Request, res: Response) => {
  try {
    const { encounterId, bedId, reason } = req.body;
    const ep = encounterPrisma();

    const bed = await ep.bed.findUnique({ where: { id: bedId } });
    if (!bed) return notFound(res, 'Bed not found');
    if ((bed as { status: string }).status !== 'AVAILABLE') return badRequest(res, 'Bed is not available');

    // Transaction: update bed + encounter + create transfer log
    await prisma.$transaction(async (tx) => {
      const txp = tx as never as typeof ep;
      await txp.bed.update({ where: { id: bedId }, data: { status: 'OCCUPIED' } });
      await txp.encounter.update({ where: { id: encounterId }, data: { bedId, status: 'ADMITTED', admitDate: new Date() } });
      await txp.bedTransfer.create({ data: { encounterId, toBedId: bedId, reason: reason || 'Admission', authorId: (req as AuthRequest).user?.id || '' } });
    });

    return ok(res, null, 'Bed allocated successfully');
  } catch { return serverError(res); }
};

export const addVitals = async (req: Request, res: Response) => {
  try {
    const ep = encounterPrisma();
    const vital = await ep.vitalSign.create({
      data: { ...req.body, encounterId: req.params.id, recordedBy: (req as AuthRequest).user?.id },
    });
    return created(res, vital);
  } catch { return serverError(res); }
};

export const addNote = async (req: Request, res: Response) => {
  try {
    const ep = encounterPrisma();
    const note = await ep.clinicalNote.create({
      data: { ...req.body, encounterId: req.params.id, authorId: (req as AuthRequest).user?.id || '' },
    });
    return created(res, note);
  } catch { return serverError(res); }
};

export const addDiagnosis = async (req: Request, res: Response) => {
  try {
    const ep = encounterPrisma();
    const diag = await ep.encounterDiagnosis.create({
      data: { ...req.body, encounterId: req.params.id },
    });
    return created(res, diag);
  } catch { return serverError(res); }
};
