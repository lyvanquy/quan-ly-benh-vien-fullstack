import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { ok, created, notFound, serverError } from '../utils/response';

export const getDoctors = async (_req: Request, res: Response) => {
  try {
    const doctors = await prisma.doctor.findMany({
      include: { user: { select: { name: true, email: true, phone: true, avatar: true } } },
    });
    return ok(res, doctors);
  } catch {
    return serverError(res);
  }
};

export const getDoctor = async (req: Request, res: Response) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, email: true, phone: true, avatar: true } },
        appointments: { where: { status: 'CONFIRMED' }, include: { patient: true }, take: 10 },
      },
    });
    if (!doctor) return notFound(res, 'Doctor not found');
    return ok(res, doctor);
  } catch {
    return serverError(res);
  }
};

export const createDoctor = async (req: Request, res: Response) => {
  try {
    const { userId, specialty, experienceYears, roomNumber, bio } = req.body;
    const doctor = await prisma.doctor.create({ data: { userId, specialty, experienceYears, roomNumber, bio } });
    return created(res, doctor);
  } catch {
    return serverError(res);
  }
};

export const updateDoctor = async (req: Request, res: Response) => {
  try {
    const doctor = await prisma.doctor.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, doctor);
  } catch {
    return serverError(res);
  }
};
