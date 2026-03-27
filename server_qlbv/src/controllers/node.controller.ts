import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { ok, created, notFound, serverError, badRequest } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/nodes/:id — full node with options + actions
export const getNode = async (req: Request, res: Response) => {
  try {
    const node = await prisma.workflowNode.findUnique({
      where: { id: req.params.id },
      include: { options: { orderBy: { order: 'asc' }, include: { actions: true } }, outEdges: true, inEdges: true },
    });
    if (!node) return notFound(res, 'Node not found');
    return ok(res, node);
  } catch { return serverError(res); }
};

// PUT /api/nodes/:id — update title, config, posX, posY
export const updateNode = async (req: AuthRequest, res: Response) => {
  try {
    const { title, config, posX, posY, type } = req.body;
    const updated = await prisma.workflowNode.update({
      where: { id: req.params.id },
      data: { title, config: config as never, posX, posY, type: type as never },
    });
    // audit
    if (req.user) {
      await prisma.auditLog.create({
        data: { userId: req.user.id, action: 'NODE_UPDATE', entity: 'WorkflowNode', entityId: req.params.id, after: updated as never },
      });
    }
    return ok(res, updated);
  } catch (e) { return badRequest(res, (e as Error).message); }
};

// POST /api/nodes/:id/options — add option to node
export const addOption = async (req: Request, res: Response) => {
  try {
    const { label, value, transitionTo, condition, order } = req.body;
    const opt = await prisma.nodeOption.create({
      data: { nodeId: req.params.id, label, value, transitionTo, condition, order: order ?? 0 },
    });
    return created(res, opt);
  } catch (e) { return badRequest(res, (e as Error).message); }
};

// PUT /api/options/:id — update option
export const updateOption = async (req: Request, res: Response) => {
  try {
    const { label, value, transitionTo, condition, order } = req.body;
    const opt = await prisma.nodeOption.update({
      where: { id: req.params.id },
      data: { label, value, transitionTo, condition, order },
    });
    return ok(res, opt);
  } catch (e) { return badRequest(res, (e as Error).message); }
};

// DELETE /api/options/:id
export const deleteOption = async (req: Request, res: Response) => {
  try {
    await prisma.nodeOption.delete({ where: { id: req.params.id } });
    return ok(res, null, 'Deleted');
  } catch { return serverError(res); }
};

// POST /api/options/:id/actions — add action to option
export const addAction = async (req: Request, res: Response) => {
  try {
    const { type, params } = req.body;
    const action = await prisma.nodeAction.create({
      data: { optionId: req.params.id, type: type as never, params: params as never },
    });
    return created(res, action);
  } catch (e) { return badRequest(res, (e as Error).message); }
};

// PUT /api/actions/:id — update action
export const updateAction = async (req: Request, res: Response) => {
  try {
    const { type, params } = req.body;
    const action = await prisma.nodeAction.update({
      where: { id: req.params.id },
      data: { type: type as never, params: params as never },
    });
    return ok(res, action);
  } catch (e) { return badRequest(res, (e as Error).message); }
};

// DELETE /api/actions/:id
export const deleteAction = async (req: Request, res: Response) => {
  try {
    await prisma.nodeAction.delete({ where: { id: req.params.id } });
    return ok(res, null, 'Deleted');
  } catch { return serverError(res); }
};

// POST /api/actions/:id/run — test-run an action
export const runAction = async (req: AuthRequest, res: Response) => {
  try {
    const action = await prisma.nodeAction.findUnique({ where: { id: req.params.id } });
    if (!action) return notFound(res, 'Action not found');
    // Log test run
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id ?? 'system',
        action: `ACTION_TEST_RUN:${action.type}`,
        entity: 'NodeAction',
        entityId: action.id,
        before: { params: action.params } as never,
      },
    });
    return ok(res, { ok: true, type: action.type, params: action.params, testMode: true });
  } catch { return serverError(res); }
};
