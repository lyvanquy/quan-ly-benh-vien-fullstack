import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { successResponse, errorResponse } from '../utils/response';

export const getEquipments = async (req: Request, res: Response) => {
  try {
    const { status, category, page = '1', limit = '20', q } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (q) where.name = { contains: String(q), mode: 'insensitive' };

    const [equipments, total] = await Promise.all([
      prisma.equipment.findMany({
        where, skip, take: Number(limit),
        include: { maintenanceLogs: { orderBy: { performedAt: 'desc' }, take: 1 } },
        orderBy: { name: 'asc' },
      }),
      prisma.equipment.count({ where }),
    ]);
    return successResponse(res, { equipments, total });
  } catch (e) { return errorResponse(res, e); }
};

export const getEquipment = async (req: Request, res: Response) => {
  try {
    const eq = await prisma.equipment.findUnique({
      where: { id: req.params.id },
      include: { maintenanceLogs: { orderBy: { performedAt: 'desc' } } },
    });
    if (!eq) return res.status(404).json({ message: 'Not found' });
    return successResponse(res, eq);
  } catch (e) { return errorResponse(res, e); }
};

export const createEquipment = async (req: Request, res: Response) => {
  try {
    const eq = await prisma.equipment.create({ data: req.body });
    return successResponse(res, eq, 201);
  } catch (e) { return errorResponse(res, e); }
};

export const updateEquipment = async (req: Request, res: Response) => {
  try {
    const eq = await prisma.equipment.update({ where: { id: req.params.id }, data: req.body });
    return successResponse(res, eq);
  } catch (e) { return errorResponse(res, e); }
};

export const deleteEquipment = async (req: Request, res: Response) => {
  try {
    await prisma.equipment.delete({ where: { id: req.params.id } });
    return successResponse(res, { deleted: true });
  } catch (e) { return errorResponse(res, e); }
};

// ─── Maintenance Logs ─────────────────────────────────────────────────────────

export const addMaintenanceLog = async (req: Request, res: Response) => {
  try {
    const log = await prisma.equipmentMaintenance.create({
      data: { equipmentId: req.params.id, ...req.body },
    });
    // Update lastService on equipment
    await prisma.equipment.update({
      where: { id: req.params.id },
      data: { lastService: log.performedAt, nextService: log.nextDue ?? undefined },
    });
    return successResponse(res, log, 201);
  } catch (e) { return errorResponse(res, e); }
};
