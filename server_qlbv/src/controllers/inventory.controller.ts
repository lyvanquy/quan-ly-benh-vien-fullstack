import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { ok, created, notFound, serverError, badRequest } from '../utils/response';

export const getItems = async (req: Request, res: Response) => {
  try {
    const { search, category } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search } }];
    if (category) where.category = category;
    const items = await prisma.inventoryItem.findMany({ where, orderBy: { name: 'asc' } });
    return ok(res, items);
  } catch { return serverError(res); }
};

export const createItem = async (req: Request, res: Response) => {
  try {
    const item = await prisma.inventoryItem.create({ data: req.body });
    return created(res, item);
  } catch { return serverError(res); }
};

export const adjustInventory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, quantity, reason } = req.body;
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) return notFound(res, 'Item not found');

    const delta = type === 'IN' ? quantity : type === 'OUT' ? -quantity : quantity;
    const newQty = item.quantity + delta;
    if (newQty < 0) return badRequest(res, 'Insufficient quantity');

    const [updated] = await prisma.$transaction([
      prisma.inventoryItem.update({ where: { id }, data: { quantity: newQty } }),
      prisma.inventoryMovement.create({ data: { itemId: id, type, quantity, reason } }),
    ]);
    return ok(res, updated);
  } catch { return serverError(res); }
};
