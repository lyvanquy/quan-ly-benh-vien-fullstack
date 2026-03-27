import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { ok, created, serverError } from '../utils/response';

export const getMedicines = async (req: Request, res: Response) => {
  try {
    const { search } = req.query as Record<string, string>;
    const medicines = await prisma.medicine.findMany({
      where: search ? { name: { contains: search, mode: 'insensitive' } } : {},
      orderBy: { name: 'asc' },
    });
    return ok(res, medicines);
  } catch {
    return serverError(res);
  }
};

export const getMedicine = async (req: Request, res: Response) => {
  try {
    const medicine = await prisma.medicine.findUnique({ where: { id: req.params.id } });
    if (!medicine) return ok(res, null);
    return ok(res, medicine);
  } catch {
    return serverError(res);
  }
};

export const createMedicine = async (req: Request, res: Response) => {
  try {
    const medicine = await prisma.medicine.create({ data: req.body });
    return created(res, medicine);
  } catch {
    return serverError(res);
  }
};

export const updateMedicine = async (req: Request, res: Response) => {
  try {
    const medicine = await prisma.medicine.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, medicine);
  } catch {
    return serverError(res);
  }
};
