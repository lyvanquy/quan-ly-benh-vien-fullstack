import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { successResponse, errorResponse } from '../utils/response';

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', q } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = q ? { name: { contains: String(q), mode: 'insensitive' as const } } : {};
    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({ where, skip, take: Number(limit), orderBy: { name: 'asc' } }),
      prisma.supplier.count({ where }),
    ]);
    return successResponse(res, { suppliers, total });
  } catch (e) { return errorResponse(res, e); }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const supplier = await prisma.supplier.create({ data: req.body });
    return successResponse(res, supplier, 201);
  } catch (e) { return errorResponse(res, e); }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data: req.body });
    return successResponse(res, supplier);
  } catch (e) { return errorResponse(res, e); }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    await prisma.supplier.delete({ where: { id: req.params.id } });
    return successResponse(res, { deleted: true });
  } catch (e) { return errorResponse(res, e); }
};

// ─── Purchase Orders ──────────────────────────────────────────────────────────

export const getPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const { supplierId, status, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where, skip, take: Number(limit),
        include: { supplier: true, items: true },
        orderBy: { orderedAt: 'desc' },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);
    return successResponse(res, { orders, total });
  } catch (e) { return errorResponse(res, e); }
};

export const getPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: { supplier: true, items: true },
    });
    if (!order) return res.status(404).json({ message: 'Not found' });
    return successResponse(res, order);
  } catch (e) { return errorResponse(res, e); }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { supplierId, note, items } = req.body;
    const totalAmount = (items as { total: number }[]).reduce((s, i) => s + i.total, 0);
    const order = await prisma.purchaseOrder.create({
      data: {
        supplierId, note, totalAmount,
        items: { create: items },
      },
      include: { items: true },
    });
    return successResponse(res, order, 201);
  } catch (e) { return errorResponse(res, e); }
};

export const updatePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { status, receivedAt, note } = req.body;
    const order = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: { status, receivedAt, note },
    });
    return successResponse(res, order);
  } catch (e) { return errorResponse(res, e); }
};
