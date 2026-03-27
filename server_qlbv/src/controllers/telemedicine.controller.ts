import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { successResponse, errorResponse } from '../utils/response';

export const getTeleConsults = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, status, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    const [consults, total] = await Promise.all([
      prisma.teleConsult.findMany({
        where, skip, take: Number(limit),
        include: {
          patient: { select: { id: true, name: true, patientCode: true } },
          doctor: { select: { id: true, specialty: true, user: { select: { name: true } } } },
        },
        orderBy: { scheduledAt: 'desc' },
      }),
      prisma.teleConsult.count({ where }),
    ]);
    return successResponse(res, { consults, total, page: Number(page) });
  } catch (e) { return errorResponse(res, e); }
};

export const getTeleConsult = async (req: Request, res: Response) => {
  try {
    const consult = await prisma.teleConsult.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        doctor: { include: { user: { select: { name: true, email: true } } } },
      },
    });
    if (!consult) return res.status(404).json({ message: 'Not found' });
    return successResponse(res, consult);
  } catch (e) { return errorResponse(res, e); }
};

export const createTeleConsult = async (req: Request, res: Response) => {
  try {
    const consult = await prisma.teleConsult.create({ data: req.body });
    return successResponse(res, consult, 201);
  } catch (e) { return errorResponse(res, e); }
};

export const updateTeleConsult = async (req: Request, res: Response) => {
  try {
    const consult = await prisma.teleConsult.update({ where: { id: req.params.id }, data: req.body });
    return successResponse(res, consult);
  } catch (e) { return errorResponse(res, e); }
};

export const startSession = async (req: Request, res: Response) => {
  try {
    const consult = await prisma.teleConsult.update({
      where: { id: req.params.id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });
    return successResponse(res, consult);
  } catch (e) { return errorResponse(res, e); }
};

export const endSession = async (req: Request, res: Response) => {
  try {
    const consult = await prisma.teleConsult.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', endedAt: new Date(), note: req.body.note },
    });
    return successResponse(res, consult);
  } catch (e) { return errorResponse(res, e); }
};
