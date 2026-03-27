import { Request, Response } from 'express';
import * as dialogService from '../services/dialog.service';
import { ok, created, notFound, serverError, badRequest } from '../utils/response';
import prisma from '../prismaClient';
import { AuthRequest } from '../middleware/auth.middleware';

export const getFlows = async (_req: Request, res: Response) => {
  try { return ok(res, await dialogService.getAllFlows()); }
  catch { return serverError(res); }
};

export const getFlow = async (req: Request, res: Response) => {
  try {
    const flow = await dialogService.getFlowByKey(req.params.key);
    if (!flow) return notFound(res, 'Flow not found');
    return ok(res, flow);
  } catch { return serverError(res); }
};

export const createFlow = async (req: Request, res: Response) => {
  try { return created(res, await dialogService.createFlow(req.body)); }
  catch (e) { return badRequest(res, (e as Error).message); }
};

export const updateFlow = async (req: Request, res: Response) => {
  try {
    const { title, description, isActive } = req.body;
    const flow = await prisma.workflow.update({ where: { id: req.params.id }, data: { title, description, isActive } });
    return ok(res, flow);
  } catch { return serverError(res); }
};

export const deleteFlow = async (req: Request, res: Response) => {
  try {
    await prisma.workflow.delete({ where: { id: req.params.id } });
    return ok(res, null, 'Flow deleted');
  } catch { return serverError(res); }
};

export const startSession = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId, context } = req.body;
    const result = await dialogService.startSession(req.params.key, patientId, context, req.user);
    return created(res, result);
  } catch (e) { return badRequest(res, (e as Error).message); }
};

export const nextNode = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, choiceValue, formData } = req.body;
    if (!sessionId) return badRequest(res, 'sessionId required');
    const result = await dialogService.processNext(sessionId, choiceValue ?? null, formData ?? null, req.user);
    return ok(res, result);
  } catch (e) { return badRequest(res, (e as Error).message); }
};

export const getSession = async (req: Request, res: Response) => {
  try {
    const session = await (prisma as never as {
      workflowSession: { findUnique: (a: unknown) => Promise<unknown> };
    }).workflowSession.findUnique({
      where: { id: req.params.sessionId },
      include: { workflow: { select: { key: true, title: true } } },
    });
    if (!session) return notFound(res, 'Session not found');
    return ok(res, session);
  } catch { return serverError(res); }
};

export const getSessions = async (req: Request, res: Response) => {
  try {
    const { patientId, flowKey } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    if (flowKey) where.workflow = { key: flowKey };
    const sessions = await (prisma as never as {
      workflowSession: { findMany: (a: unknown) => Promise<unknown[]> };
    }).workflowSession.findMany({
      where,
      include: { workflow: { select: { key: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return ok(res, sessions);
  } catch { return serverError(res); }
};
