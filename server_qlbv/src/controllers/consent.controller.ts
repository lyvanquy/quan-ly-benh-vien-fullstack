import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { successResponse, errorResponse } from '../utils/response';

export const getConsentForms = async (req: Request, res: Response) => {
  try {
    const { patientId, type, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    if (type) where.type = type;

    const [forms, total] = await Promise.all([
      prisma.consentForm.findMany({
        where, skip, take: Number(limit),
        include: { patient: { select: { id: true, name: true, patientCode: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.consentForm.count({ where }),
    ]);
    return successResponse(res, { forms, total, page: Number(page) });
  } catch (e) { return errorResponse(res, e); }
};

export const getConsentForm = async (req: Request, res: Response) => {
  try {
    const form = await prisma.consentForm.findUnique({
      where: { id: req.params.id },
      include: { patient: true },
    });
    if (!form) return res.status(404).json({ message: 'Not found' });
    return successResponse(res, form);
  } catch (e) { return errorResponse(res, e); }
};

export const createConsentForm = async (req: Request, res: Response) => {
  try {
    const form = await prisma.consentForm.create({ data: req.body });
    return successResponse(res, form, 201);
  } catch (e) { return errorResponse(res, e); }
};

export const signConsentForm = async (req: Request, res: Response) => {
  try {
    const { signedBy, witnessId, fileUrl } = req.body;
    const form = await prisma.consentForm.update({
      where: { id: req.params.id },
      data: { signedAt: new Date(), signedBy, witnessId, fileUrl },
    });
    return successResponse(res, form);
  } catch (e) { return errorResponse(res, e); }
};

export const deleteConsentForm = async (req: Request, res: Response) => {
  try {
    await prisma.consentForm.delete({ where: { id: req.params.id } });
    return successResponse(res, { deleted: true });
  } catch (e) { return errorResponse(res, e); }
};
