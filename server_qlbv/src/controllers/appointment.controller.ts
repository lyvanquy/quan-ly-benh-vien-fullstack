import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { ok, created, notFound, serverError } from '../utils/response';

export const getAppointments = async (req: Request, res: Response) => {
  try {
    const { date, doctorId, status, page = '1', limit = '10' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: Record<string, unknown> = {};
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.appointmentDate = { gte: start, lt: end };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          patient: { select: { id: true, name: true, phone: true } },
          doctor: { include: { user: { select: { name: true } } } },
        },
        orderBy: { appointmentDate: 'asc' },
      }),
      prisma.appointment.count({ where }),
    ]);

    return ok(res, { appointments, total });
  } catch {
    return serverError(res);
  }
};

export const getAppointment = async (req: Request, res: Response) => {
  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: { select: { id: true, name: true, phone: true, patientCode: true } },
        doctor: { include: { user: { select: { name: true } } } },
      },
    });
    if (!appt) return notFound(res, 'Appointment not found');
    return ok(res, appt);
  } catch {
    return serverError(res);
  }
};

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const appt = await prisma.appointment.create({
      data: req.body,
      include: {
        patient: { select: { name: true } },
        doctor: { include: { user: { select: { name: true } } } },
      },
    });
    return created(res, appt);
  } catch {
    return serverError(res);
  }
};

export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const appt = await prisma.appointment.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, appt);
  } catch {
    return serverError(res);
  }
};

export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    await prisma.appointment.delete({ where: { id: req.params.id } });
    return ok(res, null, 'Appointment deleted');
  } catch {
    return serverError(res);
  }
};

export const getTodayAppointments = async (_req: Request, res: Response) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const appointments = await prisma.appointment.findMany({
      where: { appointmentDate: { gte: start, lte: end } },
      include: {
        patient: { select: { name: true, phone: true } },
        doctor: { include: { user: { select: { name: true } } } },
      },
      orderBy: { appointmentDate: 'asc' },
    });
    return ok(res, appointments);
  } catch {
    return serverError(res);
  }
};
