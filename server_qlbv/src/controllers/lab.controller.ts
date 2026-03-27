import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { ok, created, notFound, serverError } from '../utils/response';

export const getLabTests = async (req: Request, res: Response) => {
  try {
    const { search } = req.query as Record<string, string>;
    const tests = await prisma.labTest.findMany({
      where: search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search } }] } : {},
      orderBy: { name: 'asc' },
    });
    return ok(res, tests);
  } catch { return serverError(res); }
};

export const createLabTest = async (req: Request, res: Response) => {
  try {
    const test = await prisma.labTest.create({ data: req.body });
    return created(res, test);
  } catch { return serverError(res); }
};

export const getLabOrders = async (req: Request, res: Response) => {
  try {
    const { patientId, status, page = '1', limit = '10' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.labOrder.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          patient: { select: { name: true, patientCode: true } },
          items: { include: { test: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.labOrder.count({ where }),
    ]);
    return ok(res, { orders, total });
  } catch { return serverError(res); }
};

export const createLabOrder = async (req: Request, res: Response) => {
  try {
    const { patientId, recordId, note, items } = req.body;
    const order = await prisma.labOrder.create({
      data: {
        patientId,
        recordId,
        note,
        items: { create: items.map((i: { testId: string }) => ({ testId: i.testId })) },
      },
      include: { items: { include: { test: true } }, patient: { select: { name: true } } },
    });
    return created(res, order);
  } catch { return serverError(res); }
};

export const updateLabResult = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const { result, isAbnormal, unit, normalRange } = req.body;
    const item = await prisma.labOrderItem.update({
      where: { id: itemId },
      data: { result, isAbnormal, unit, normalRange, completedAt: new Date() },
    });

    // Check if all items completed → update order status
    const order = await prisma.labOrder.findUnique({
      where: { id: item.orderId },
      include: { items: true },
    });
    if (order && order.items.every((i) => i.completedAt)) {
      await prisma.labOrder.update({
        where: { id: order.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }
    return ok(res, item);
  } catch { return serverError(res); }
};

// ─── Specimen Tracking ────────────────────────────────────────────────────────
const sp = () => prisma as never as {
  specimen: {
    create: (a: unknown) => Promise<unknown>;
    findUnique: (a: unknown) => Promise<unknown>;
    update: (a: unknown) => Promise<unknown>;
    findMany: (a: unknown) => Promise<unknown[]>;
  };
  specimenLog: { create: (a: unknown) => Promise<unknown> };
};

export const createSpecimen = async (req: Request, res: Response) => {
  try {
    const { labOrderId, type, collectedBy } = req.body;
    const specimen = await sp().specimen.create({
      data: { labOrderId, type, collectedBy, collectedAt: new Date(), status: 'COLLECTED' },
    });
    await sp().specimenLog.create({
      data: { specimenId: (specimen as { id: string }).id, status: 'COLLECTED', performedBy: collectedBy, note: 'Lay mau' },
    });
    return created(res, specimen);
  } catch { return serverError(res); }
};

export const updateSpecimenStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note, performedBy, rejectionReason } = req.body;

    const updateData: Record<string, unknown> = { status };
    if (status === 'RECEIVED') updateData.receivedAt = new Date();
    if (status === 'RESULTED') updateData.resultedAt = new Date();
    if (rejectionReason) updateData.rejectionReason = rejectionReason;

    const specimen = await sp().specimen.update({ where: { id }, data: updateData });
    await sp().specimenLog.create({
      data: { specimenId: id, status: status as never, note, performedBy },
    });

    // If rejected, update lab order item status
    if (status === 'REJECTED') {
      const s = specimen as { labOrderId: string };
      await prisma.labOrder.update({ where: { id: s.labOrderId }, data: { status: 'CANCELLED' } });
    }

    return ok(res, specimen);
  } catch { return serverError(res); }
};
