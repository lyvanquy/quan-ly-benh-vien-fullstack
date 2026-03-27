import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { ok, created, notFound, serverError } from '../utils/response';

export const getBills = async (req: Request, res: Response) => {
  try {
    const { patientId, paymentStatus, page = '1', limit = '10' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { patient: { select: { name: true } }, items: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.bill.count({ where }),
    ]);
    return ok(res, { bills, total });
  } catch {
    return serverError(res);
  }
};

export const getBill = async (req: Request, res: Response) => {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: req.params.id },
      include: { patient: true, items: true },
    });
    if (!bill) return notFound(res, 'Bill not found');
    return ok(res, bill);
  } catch {
    return serverError(res);
  }
};

export const createBill = async (req: Request, res: Response) => {
  try {
    const { patientId, items, discount = 0, insuranceCover = 0 } = req.body;
    const totalAmount = items.reduce((sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity, 0);
    const finalAmount = totalAmount - discount - insuranceCover;
    const bill = await prisma.bill.create({
      data: { 
        patientId, 
        totalAmount, 
        discount,
        insuranceCover,
        finalAmount,
        items: { create: items },
        patient: { connect: { id: patientId } }
      },
      include: { items: true, patient: { select: { name: true } } },
    });
    return created(res, bill);
  } catch {
    return serverError(res);
  }
};

export const updateBillStatus = async (req: Request, res: Response) => {
  try {
    const bill = await prisma.bill.update({
      where: { id: req.params.id },
      data: { paymentStatus: req.body.paymentStatus },
    });
    return ok(res, bill);
  } catch {
    return serverError(res);
  }
};
