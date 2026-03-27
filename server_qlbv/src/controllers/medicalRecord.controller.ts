import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { ok, created, notFound, serverError } from '../utils/response';

export const getRecords = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.query as Record<string, string>;
    const records = await prisma.medicalRecord.findMany({
      where: patientId ? { patientId } : {},
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        patient: { select: { name: true } },
        prescriptions: { include: { medicine: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, records);
  } catch {
    return serverError(res);
  }
};

export const getRecord = async (req: Request, res: Response) => {
  try {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: req.params.id },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        patient: true,
        prescriptions: { include: { medicine: true } },
      },
    });
    if (!record) return notFound(res, 'Record not found');
    return ok(res, record);
  } catch {
    return serverError(res);
  }
};

export const createRecord = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, diagnosis, treatment, note, prescriptions } = req.body;
    const record = await prisma.medicalRecord.create({
      data: {
        patientId,
        doctorId,
        diagnosis,
        treatment,
        note,
        prescriptions: prescriptions
          ? { create: prescriptions }
          : undefined,
      },
      include: { prescriptions: { include: { medicine: true } } },
    });
    return created(res, record);
  } catch {
    return serverError(res);
  }
};
