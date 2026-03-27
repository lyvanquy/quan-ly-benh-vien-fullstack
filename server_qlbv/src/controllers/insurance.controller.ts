import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { ok, created, notFound, serverError } from '../utils/response';

const ip = () => prisma as never as {
  insurancePolicy: { findMany: (a: unknown) => Promise<unknown[]>; create: (a: unknown) => Promise<unknown> };
  insuranceClaim: { findMany: (a: unknown) => Promise<unknown[]>; create: (a: unknown) => Promise<unknown>; update: (a: unknown) => Promise<unknown> };
};

export const getPolicies = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.query as Record<string, string>;
    const policies = await ip().insurancePolicy.findMany({
      where: patientId ? { patientId } : {},
      include: { patient: { select: { name: true } } },
      orderBy: { validTo: 'desc' },
    });
    return ok(res, policies);
  } catch { return serverError(res); }
};

export const createPolicy = async (req: Request, res: Response) => {
  try {
    const policy = await ip().insurancePolicy.create({ data: req.body });
    return created(res, policy);
  } catch { return serverError(res); }
};

export const getClaims = async (req: Request, res: Response) => {
  try {
    const { status } = req.query as Record<string, string>;
    const claims = await ip().insuranceClaim.findMany({
      where: status ? { status } : {},
      include: { bill: { include: { patient: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, claims);
  } catch { return serverError(res); }
};

export const createClaim = async (req: Request, res: Response) => {
  try {
    const claim = await ip().insuranceClaim.create({ data: req.body });
    return created(res, claim);
  } catch { return serverError(res); }
};

export const updateClaimStatus = async (req: Request, res: Response) => {
  try {
    const { status, response } = req.body;
    const claim = await ip().insuranceClaim.update({
      where: { id: req.params.id },
      data: {
        status,
        response,
        ...(status === 'SUBMITTED' ? { submittedAt: new Date() } : {}),
        ...(status === 'PAID' ? { paidAt: new Date() } : {}),
      },
    });
    return ok(res, claim);
  } catch { return serverError(res); }
};
