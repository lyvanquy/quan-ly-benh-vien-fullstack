import { Request, Response } from 'express';
import prisma from '../prismaClient';
import bcrypt from 'bcryptjs';
import { ok, created, notFound, serverError } from '../utils/response';

export const getStaff = async (_req: Request, res: Response) => {
  try {
    const staff = await prisma.staff.findMany({
      include: { user: { select: { name: true, email: true, role: true, phone: true, isActive: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, staff);
  } catch { return serverError(res); }
};

export const createStaff = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone, department, position, joinDate, salary } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { name, email, password: hashed, role, phone } });
      const staff = await tx.staff.create({ data: { userId: user.id, department, position, joinDate: new Date(joinDate), salary } });
      return { ...staff, user: { name: user.name, email: user.email, role: user.role } };
    });
    return created(res, result);
  } catch { return serverError(res); }
};

export const getShifts = async (req: Request, res: Response) => {
  try {
    const { staffId, date } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (staffId) where.staffId = staffId;
    if (date) {
      const d = new Date(date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    }
    const shifts = await prisma.shift.findMany({
      where,
      include: { staff: { include: { user: { select: { name: true, role: true } } } } },
      orderBy: { date: 'asc' },
    });
    return ok(res, shifts);
  } catch { return serverError(res); }
};

export const createShift = async (req: Request, res: Response) => {
  try {
    const shift = await prisma.shift.create({ data: req.body });
    return created(res, shift);
  } catch { return serverError(res); }
};
