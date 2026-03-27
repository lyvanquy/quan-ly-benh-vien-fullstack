import { Request, Response } from 'express';
import * as engine from '../services/workflow.engine';
import { ok, created, notFound, serverError, badRequest } from '../utils/response';
import prisma from '../prismaClient';

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export const getWorkflows = async (_req: Request, res: Response) => {
  try { return ok(res, await engine.getAllWorkflows()); }
  catch { return serverError(res); }
};

export const getWorkflow = async (req: Request, res: Response) => {
  try {
    const wf = await engine.getWorkflowByKey(req.params.key);
    if (!wf) return notFound(res, 'Workflow not found');
    return ok(res, wf);
  } catch { return serverError(res); }
};

export const createWorkflow = async (req: Request, res: Response) => {
  try {
    const wf = await engine.createWorkflow(req.body);
    return created(res, wf);
  } catch (e) { return badRequest(res, (e as Error).message); }
};

export const updateWorkflow = async (req: Request, res: Response) => {
  try {
    const { title, description, isActive } = req.body;
    const wf = await prisma.workflow.update({ where: { id: req.params.id }, data: { title, description, isActive } });
    return ok(res, wf);
  } catch { return serverError(res); }
};

export const deleteWorkflow = async (req: Request, res: Response) => {
  try {
    await prisma.workflow.delete({ where: { id: req.params.id } });
    return ok(res, null, 'Deleted');
  } catch { return serverError(res); }
};

// Update node positions (from drag & drop)
export const updateNodePositions = async (req: Request, res: Response) => {
  try {
    const { nodes } = req.body as { nodes: Array<{ id: string; posX: number; posY: number }> };
    await Promise.all(nodes.map((n) => prisma.workflowNode.update({ where: { id: n.id }, data: { posX: n.posX, posY: n.posY } })));
    return ok(res, null, 'Positions updated');
  } catch { return serverError(res); }
};

// ─── Runtime ─────────────────────────────────────────────────────────────────

export const startSession = async (req: Request, res: Response) => {
  try {
    const { patientId, context } = req.body;
    const result = await engine.startSession(req.params.key, patientId, context);
    return created(res, result);
  } catch (e) { return badRequest(res, (e as Error).message); }
};

export const nextNode = async (req: Request, res: Response) => {
  try {
    const { sessionId, choiceValue, formData } = req.body;
    if (!sessionId) return badRequest(res, 'sessionId required');
    const result = await engine.processNext(sessionId, choiceValue ?? null, formData ?? null);
    return ok(res, result);
  } catch (e) { return badRequest(res, (e as Error).message); }
};

export const getSession = async (req: Request, res: Response) => {
  try {
    const session = await prisma.workflowSession.findUnique({
      where: { id: req.params.sessionId },
      include: { workflow: { select: { key: true, title: true } }, logs: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) return notFound(res, 'Session not found');
    return ok(res, session);
  } catch { return serverError(res); }
};

export const getSessions = async (req: Request, res: Response) => {
  try {
    const { patientId, workflowKey, status } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (workflowKey) where.workflow = { key: workflowKey };
    const sessions = await prisma.workflowSession.findMany({
      where,
      include: { workflow: { select: { key: true, title: true } }, patient: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return ok(res, sessions);
  } catch { return serverError(res); }
};
