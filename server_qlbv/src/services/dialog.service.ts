/**
 * dialog.service.ts — thin adapter that delegates to the Workflow engine.
 * The old DialogFlow/DialogSession models no longer exist in schema;
 * we reuse Workflow / WorkflowSession for everything.
 */
import * as engine from './workflow.engine';

export type { WFContext as DialogContext } from './workflow.engine';
export { evalCondition } from './workflow.engine';

export const getAllFlows = () => engine.getAllWorkflows();
export const getFlowByKey = (key: string) => engine.getWorkflowByKey(key);
export const createFlow = (data: Parameters<typeof engine.createWorkflow>[0]) => engine.createWorkflow(data);

export const startSession = (
  flowKey: string,
  patientId?: string,
  initialCtx: Record<string, unknown> = {},
  user?: engine.WFUser
) => engine.startSession(flowKey, patientId, initialCtx, user);

export const processNext = (
  sessionId: string,
  choiceValue: string | null,
  formData: Record<string, unknown> | null,
  user?: engine.WFUser
) => engine.processNext(sessionId, choiceValue, formData, user);
