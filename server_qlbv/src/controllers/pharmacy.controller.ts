import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { ok, created, notFound, serverError, badRequest } from '../utils/response';

export const getMedicines = async (req: Request, res: Response) => {
  try {
    const { search, lowStock, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = {};
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search } }];
    if (lowStock === 'true') where.stock = { lte: prisma.medicine.fields.minStock };

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({ where, skip, take: parseInt(limit), orderBy: { name: 'asc' } }),
      prisma.medicine.count({ where }),
    ]);
    return ok(res, { medicines, total });
  } catch { return serverError(res); }
};

export const createMedicine = async (req: Request, res: Response) => {
  try {
    const medicine = await prisma.medicine.create({ data: req.body });
    return created(res, medicine);
  } catch { return serverError(res); }
};

export const updateMedicine = async (req: Request, res: Response) => {
  try {
    const medicine = await prisma.medicine.update({ where: { id: req.params.id }, data: req.body });
    return ok(res, medicine);
  } catch { return serverError(res); }
};

export const adjustStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, quantity, reason } = req.body;
    const medicine = await prisma.medicine.findUnique({ where: { id } });
    if (!medicine) return notFound(res, 'Medicine not found');

    const delta = type === 'IN' ? quantity : type === 'OUT' ? -quantity : quantity;
    const newStock = medicine.stock + delta;
    if (newStock < 0) return badRequest(res, 'Insufficient stock');

    const [updated] = await prisma.$transaction([
      prisma.medicine.update({ where: { id }, data: { stock: newStock } }),
      prisma.stockMovement.create({ data: { medicineId: id, type, quantity, reason } }),
    ]);
    return ok(res, updated);
  } catch { return serverError(res); }
};

export const dispensePrescription = async (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { medicine: true },
    });
    if (!prescription) return notFound(res, 'Prescription not found');
    if (prescription.dispensed) return badRequest(res, 'Already dispensed');
    if (prescription.medicine.stock < prescription.quantity) return badRequest(res, 'Insufficient stock');

    await prisma.$transaction([
      prisma.prescription.update({ where: { id: prescriptionId }, data: { dispensed: true, dispensedAt: new Date() } }),
      prisma.medicine.update({ where: { id: prescription.medicineId }, data: { stock: { decrement: prescription.quantity } } }),
      prisma.stockMovement.create({ data: { medicineId: prescription.medicineId, type: 'OUT', quantity: prescription.quantity, reason: `Dispensed prescription ${prescriptionId}` } }),
    ]);
    return ok(res, null, 'Dispensed successfully');
  } catch { return serverError(res); }
};

export const getLowStockAlerts = async (_req: Request, res: Response) => {
  try {
    const medicines = await prisma.$queryRaw`
      SELECT * FROM "Medicine" WHERE stock <= "minStock" ORDER BY stock ASC
    `;
    return ok(res, medicines);
  } catch { return serverError(res); }
};
