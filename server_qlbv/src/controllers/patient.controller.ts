import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { ok, created, notFound, serverError } from '../utils/response';

export const getPatients = async (req: Request, res: Response) => {
  try {
    const { search, page = '1', limit = '10' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { phone: { contains: search } }] }
      : {};

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
      prisma.patient.count({ where }),
    ]);

    return ok(res, { patients, total, page: parseInt(page), limit: parseInt(limit) });
  } catch {
    return serverError(res);
  }
};

export const getPatient = async (req: Request, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        appointments: { include: { doctor: { include: { user: { select: { name: true } } } } }, orderBy: { appointmentDate: 'desc' }, take: 5 },
        medicalRecords: { include: { doctor: { include: { user: { select: { name: true } } } }, prescriptions: { include: { medicine: true } } }, orderBy: { createdAt: 'desc' }, take: 5 },
        bills: { orderBy: { createdAt: 'desc' }, take: 5 },
        encounters: { orderBy: { createdAt: 'desc' }, take: 5 },
        labOrders: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!patient) return notFound(res, 'Patient not found');
    return ok(res, patient);
  } catch {
    return serverError(res);
  }
};

export const createPatient = async (req: Request, res: Response) => {
  try {
    const patient = await prisma.patient.create({ data: req.body });
    return created(res, patient);
  } catch {
    return serverError(res);
  }
};

export const updatePatient = async (req: Request, res: Response) => {
  try {
    const patient = await prisma.patient.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, patient);
  } catch {
    return serverError(res);
  }
};

export const deletePatient = async (req: Request, res: Response) => {
  try {
    await prisma.patient.delete({ where: { id: req.params.id } });
    return ok(res, null, 'Patient deleted');
  } catch {
    return serverError(res);
  }
};
