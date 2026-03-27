import prisma from '../prismaClient';
import { ActionType } from '@prisma/client';
import { hasPermission } from '../middleware/permission.middleware';
import { v4 as uuidv4 } from 'uuid';

export interface WFContext { [key: string]: unknown }
export interface WFUser { id: string; role: string; email: string }

// ─── Permission map: ActionType → permission key ──────────────────────────────
const ACTION_PERMISSION: Record<string, string> = {
  CREATE_APPOINTMENT:          'appointment.create',
  CREATE_RECORD:               'medicalrecord.create',
  CREATE_LAB_ORDER:            'lab.create_order',
  CREATE_BILL:                 'billing.create',
  SEND_NOTIFICATION:           'notification.send',
  UPDATE_APPOINTMENT_STATUS:   'appointment.update_status',
  ALLOCATE_BED:                'bed.allocate',
  DISCHARGE_PATIENT:           'encounter.discharge',
  CREATE_REFERRAL:             'referral.create',
  RESERVE_OR:                  'surgery.schedule',
  CREATE_CONSENT:              'consent.create',
};

// ─── Safe condition evaluator ─────────────────────────────────────────────────
export function evalCondition(expr: string | null | undefined, ctx: WFContext, user?: WFUser): boolean {
  if (!expr) return true;
  try {
    const safe = expr.replace(/[^a-zA-Z0-9_.\s><=!&|()'"]/g, '');
    // eslint-disable-next-line no-new-func
    return !!new Function('ctx', 'user', `"use strict"; return !!(${safe});`)(ctx, user ?? {});
  } catch { return false; }
}

// ─── Saga helpers ─────────────────────────────────────────────────────────────
async function sagaLog(sagaId: string, sessionId: string | null, step: string, status: string, payload?: unknown, error?: string) {
  await (prisma as never as {
    sagaLog: { create: (a: unknown) => Promise<unknown> };
  }).sagaLog.create({ data: { sagaId, sessionId, step, status, payload: payload as never, error } });
}

// ─── Workflow CRUD ────────────────────────────────────────────────────────────
export async function getWorkflowByKey(key: string) {
  return prisma.workflow.findUnique({
    where: { key, isActive: true },
    include: {
      nodes: {
        orderBy: { order: 'asc' },
        include: { options: { orderBy: { order: 'asc' }, include: { actions: true } }, outEdges: true },
      },
      edges: true,
    },
  });
}

export async function getAllWorkflows() {
  return prisma.workflow.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { nodes: true, sessions: true } } },
  });
}

export async function createWorkflow(data: {
  key: string; title: string; description?: string;
  nodes?: Array<{
    key: string; type: string; title: string; config?: unknown;
    posX?: number; posY?: number; order?: number;
    options?: Array<{
      label: string; value: string; transitionTo?: string; condition?: string; order?: number;
      actions?: Array<{ type: string; params?: unknown }>;
    }>;
  }>;
  edges?: Array<{ fromNodeKey: string; toNodeKey: string; condition?: string; label?: string }>;
}) {
  const { nodes = [], edges = [], ...wfData } = data;
  return prisma.$transaction(async (tx) => {
    const wf = await tx.workflow.create({ data: wfData });
    const nodeMap: Record<string, string> = {};
    for (const n of nodes) {
      const node = await tx.workflowNode.create({
        data: {
          workflowId: wf.id, key: n.key, type: n.type as never, title: n.title,
          config: n.config as never, posX: n.posX ?? 0, posY: n.posY ?? 0, order: n.order ?? 0,
          options: n.options ? {
            create: n.options.map((o) => ({
              label: o.label, value: o.value, transitionTo: o.transitionTo,
              condition: o.condition, order: o.order ?? 0,
              actions: o.actions ? { create: o.actions.map((a) => ({ type: a.type as never, params: a.params as never })) } : undefined,
            })),
          } : undefined,
        },
      });
      nodeMap[n.key] = node.id;
    }
    for (const e of edges) {
      const fromId = nodeMap[e.fromNodeKey], toId = nodeMap[e.toNodeKey];
      if (fromId && toId) {
        await tx.workflowEdge.create({
          data: { workflowId: wf.id, fromNodeId: fromId, toNodeId: toId, condition: e.condition, label: e.label },
        });
      }
    }
    return tx.workflow.findUnique({
      where: { id: wf.id },
      include: { nodes: { include: { options: true, outEdges: true } }, edges: true },
    });
  });
}

// ─── Session lifecycle ────────────────────────────────────────────────────────
export async function startSession(workflowKey: string, patientId?: string, ctx: WFContext = {}, user?: WFUser) {
  const wf = await getWorkflowByKey(workflowKey);
  if (!wf) throw new Error('Workflow not found');

  const incomingIds = new Set(wf.edges.map((e) => e.toNodeId));
  const startNode = wf.nodes.find((n) => !incomingIds.has(n.id)) ?? wf.nodes[0];
  if (!startNode) throw new Error('Workflow has no nodes');

  const session = await (prisma as never as {
    workflowSession: { create: (a: unknown) => Promise<{ id: string }> };
  }).workflowSession.create({
    data: {
      workflowId: wf.id, patientId, context: ctx as never,
      answers: [] as never, currentNodeId: startNode.id,
      initiatorId: user?.id,
    },
  });

  await prisma.sessionLog.create({ data: { sessionId: session.id, nodeId: startNode.id, action: 'START', payload: { workflowKey, patientId } as never } });
  return { sessionId: session.id, node: startNode, context: ctx };
}

// ─── Core: processNext with permission + saga ─────────────────────────────────
export async function processNext(
  sessionId: string,
  choiceValue: string | null,
  formData: WFContext | null,
  user?: WFUser
) {
  const session = await (prisma as never as {
    workflowSession: { findUnique: (a: unknown) => Promise<{ id: string; workflowId: string; patientId: string | null; context: unknown; answers: unknown; currentNodeId: string | null; status: string; initiatorId: string | null } | null> };
  }).workflowSession.findUnique({ where: { id: sessionId } });

  if (!session) throw new Error('Session not found');
  if (session.status !== 'ACTIVE') throw new Error('Session is not active');

  const wf = await prisma.workflow.findUnique({
    where: { id: session.workflowId },
    include: {
      nodes: { include: { options: { include: { actions: true } }, outEdges: true } },
      edges: true,
    },
  });
  if (!wf) throw new Error('Workflow not found');

  const ctx: WFContext = { ...(session.context as WFContext), ...(formData || {}) };
  const answers = [...(session.answers as unknown[])];
  const currentNode = wf.nodes.find((n) => n.id === session.currentNodeId);
  if (!currentNode) throw new Error('Current node not found');

  answers.push({ nodeId: currentNode.id, nodeKey: currentNode.key, value: choiceValue ?? formData, ts: new Date() });

  // Resolve next node
  let nextNodeId: string | null = null;
  let matchedOption: typeof currentNode.options[0] | null = null;

  if (currentNode.type === 'TEXT' || currentNode.type === 'ACTION') {
    const edge = currentNode.outEdges.find((e) => evalCondition(e.condition, ctx, user));
    nextNodeId = edge?.toNodeId ?? null;
  } else {
    for (const opt of currentNode.options) {
      if (choiceValue && opt.value !== choiceValue) continue;
      if (!evalCondition(opt.condition, ctx, user)) continue;
      matchedOption = opt;
      nextNodeId = opt.transitionTo ?? null;
      break;
    }
    if (!nextNodeId) {
      const edge = currentNode.outEdges.find((e) => evalCondition(e.condition, ctx, user));
      nextNodeId = edge?.toNodeId ?? null;
    }
  }

  // Execute actions with permission check + saga
  if (matchedOption && matchedOption.actions.length > 0) {
    const sagaId = uuidv4();
    await executeActionsWithSaga(matchedOption.actions, ctx, session.patientId, user, sagaId, sessionId);
  }

  const completed = !nextNodeId;
  await (prisma as never as {
    workflowSession: { update: (a: unknown) => Promise<unknown> };
  }).workflowSession.update({
    where: { id: sessionId },
    data: { context: ctx as never, answers: answers as never, currentNodeId: nextNodeId, status: completed ? 'COMPLETED' : 'ACTIVE' },
  });

  await prisma.sessionLog.create({
    data: { sessionId, nodeId: currentNode.id, action: 'NEXT', payload: { choiceValue, nextNodeId, completed } as never },
  });

  const nextNode = nextNodeId ? wf.nodes.find((n) => n.id === nextNodeId) ?? null : null;
  return { node: nextNode, completed, context: ctx };
}

// ─── Action executor with permission + saga compensation ─────────────────────
async function executeActionsWithSaga(
  actions: Array<{ id: string; type: ActionType; params: unknown }>,
  ctx: WFContext,
  patientId: string | null,
  user: WFUser | undefined,
  sagaId: string,
  sessionId: string
) {
  const executed: Array<{ type: string; compensate: () => Promise<void> }> = [];

  for (const action of actions) {
    const permKey = ACTION_PERMISSION[action.type] ?? 'workflow.manage';

    // Permission check
    if (user) {
      const allowed = await hasPermission(user, permKey, { ...ctx, patientId });
      if (!allowed) {
        await sagaLog(sagaId, sessionId, action.type, 'BLOCKED', { permKey });
        await prisma.sessionLog.create({
          data: { sessionId, nodeId: null, action: 'ACTION_BLOCKED', payload: { actionId: action.id, type: action.type, permKey } as never },
        });
        continue;
      }
    }

    await sagaLog(sagaId, sessionId, action.type, 'PENDING', action.params);

    try {
      const compensate = await executeAction(action.type, action.params as Record<string, unknown>, ctx, patientId);
      executed.push({ type: action.type, compensate });
      await sagaLog(sagaId, sessionId, action.type, 'SUCCESS');
      await prisma.sessionLog.create({
        data: { sessionId, nodeId: null, action: 'ACTION_SUCCESS', payload: { actionId: action.id, type: action.type } as never },
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await sagaLog(sagaId, sessionId, action.type, 'FAILED', action.params, errMsg);
      await prisma.sessionLog.create({
        data: { sessionId, nodeId: null, action: 'ACTION_FAILED', payload: { actionId: action.id, type: action.type, error: errMsg } as never },
      });

      // Compensate previously executed steps (reverse order)
      for (const done of [...executed].reverse()) {
        try {
          await done.compensate();
          await sagaLog(sagaId, sessionId, done.type, 'COMPENSATED');
        } catch (ce) {
          await sagaLog(sagaId, sessionId, done.type, 'COMPENSATION_FAILED', undefined, String(ce));
        }
      }
      break; // stop processing further actions in this saga
    }
  }
}

// ─── Individual action executors (return compensation function) ───────────────
async function executeAction(
  type: ActionType,
  params: Record<string, unknown>,
  ctx: WFContext,
  patientId: string | null
): Promise<() => Promise<void>> {
  const p = { ...params };

  if (type === 'CREATE_APPOINTMENT' && patientId) {
    const appt = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: (p.doctorId ?? ctx.doctorId) as string,
        appointmentDate: new Date((p.appointmentDate ?? ctx.appointmentDate) as string),
        note: (p.note ?? 'Tao tu workflow') as string,
      },
    });
    return async () => { await prisma.appointment.delete({ where: { id: appt.id } }); };
  }

  if (type === 'CREATE_RECORD' && patientId) {
    const rec = await prisma.medicalRecord.create({
      data: {
        patientId,
        doctorId: (p.doctorId ?? ctx.doctorId) as string,
        diagnosis: (p.diagnosis ?? ctx.diagnosis ?? 'Chua xac dinh') as string,
        treatment: (p.treatment ?? ctx.treatment) as string | undefined,
      },
    });
    return async () => { await prisma.medicalRecord.delete({ where: { id: rec.id } }); };
  }

  if (type === 'CREATE_LAB_ORDER' && patientId) {
    const order = await prisma.labOrder.create({ data: { patientId, note: p.note as string | undefined } });
    return async () => { await prisma.labOrder.delete({ where: { id: order.id } }); };
  }

  if (type === 'CREATE_BILL' && patientId) {
    const items = (p.items ?? []) as Array<{ serviceName: string; serviceType?: string; price: number; quantity: number }>;
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const bill = await prisma.bill.create({
      data: {
        patientId, totalAmount: total, finalAmount: total,
        items: { create: items.map((i) => ({ ...i, total: i.price * i.quantity })) },
      },
    });
    return async () => { await prisma.bill.delete({ where: { id: bill.id } }); };
  }

  if (type === 'UPDATE_APPOINTMENT_STATUS' && ctx.appointmentId) {
    const prev = await prisma.appointment.findUnique({ where: { id: ctx.appointmentId as string } });
    await prisma.appointment.update({ where: { id: ctx.appointmentId as string }, data: { status: (p.status ?? 'CONFIRMED') as never } });
    return async () => {
      if (prev) await prisma.appointment.update({ where: { id: prev.id }, data: { status: prev.status } });
    };
  }

  if (type === 'ALLOCATE_BED' && ctx.encounterId && p.bedId) {
    const bed = await (prisma as never as { bed: { findUnique: (a: unknown) => Promise<{ status: string } | null>; update: (a: unknown) => Promise<unknown> } }).bed.findUnique({ where: { id: p.bedId } });
    if (!bed || (bed as { status: string }).status !== 'AVAILABLE') throw new Error('Bed not available');
    await (prisma as never as { bed: { update: (a: unknown) => Promise<unknown> } }).bed.update({ where: { id: p.bedId }, data: { status: 'OCCUPIED' } });
    await (prisma as never as { encounter: { update: (a: unknown) => Promise<unknown> } }).encounter.update({ where: { id: ctx.encounterId }, data: { bedId: p.bedId, status: 'ADMITTED', admitDate: new Date() } });
    return async () => {
      await (prisma as never as { bed: { update: (a: unknown) => Promise<unknown> } }).bed.update({ where: { id: p.bedId }, data: { status: 'AVAILABLE' } });
      await (prisma as never as { encounter: { update: (a: unknown) => Promise<unknown> } }).encounter.update({ where: { id: ctx.encounterId }, data: { bedId: null, status: 'REGISTERED' } });
    };
  }

  if (type === 'SEND_NOTIFICATION') {
    await (prisma as never as { notification: { create: (a: unknown) => Promise<unknown> } }).notification.create({
      data: { userId: p.userId as string | undefined, title: p.title as string ?? 'Thong bao', message: p.message as string ?? '', type: p.type as string ?? 'INFO', link: p.link as string | undefined },
    });
    return async () => {}; // notifications are not compensated
  }

  if (type === 'DISCHARGE_PATIENT' && ctx.encounterId) {
    await (prisma as never as { encounter: { update: (a: unknown) => Promise<unknown> } }).encounter.update({
      where: { id: ctx.encounterId }, data: { status: 'DISCHARGED', dischargeDate: new Date(), dischargeNote: p.note as string | undefined },
    });
    return async () => {
      await (prisma as never as { encounter: { update: (a: unknown) => Promise<unknown> } }).encounter.update({ where: { id: ctx.encounterId }, data: { status: 'ADMITTED', dischargeDate: null } });
    };
  }

  // No-op for unhandled types
  return async () => {};
}
