import { create } from 'zustand';

export type EntityType =
  | 'patient' | 'appointment' | 'doctor' | 'encounter'
  | 'bill' | 'lab_order' | 'medicine' | 'bed'
  | 'surgery' | 'referral' | 'consent' | 'teleconsult'
  | 'workflow_node';

export interface DialogFrame {
  entity: EntityType;
  id?: string;
  mode?: 'view' | 'create' | 'edit';
  title?: string;
  ctx?: Record<string, unknown>;
}

interface EntityDialogState {
  stack: DialogFrame[];
  push: (frame: DialogFrame) => void;
  pop: () => void;
  replace: (frame: DialogFrame) => void;
  clear: () => void;
}

export const useEntityDialog = create<EntityDialogState>((set) => ({
  stack: [],
  push: (frame) => set((s) => ({ stack: [...s.stack, frame] })),
  pop: () => set((s) => ({ stack: s.stack.slice(0, -1) })),
  replace: (frame) => set((s) => ({ stack: [...s.stack.slice(0, -1), frame] })),
  clear: () => set({ stack: [] }),
}));

export function useOpenDialog() {
  const push = useEntityDialog((s) => s.push);
  return (entity: EntityType, id?: string, mode: DialogFrame['mode'] = 'view', ctx?: Record<string, unknown>) => {
    push({ entity, id, mode, ctx });
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('dlg', entity);
      if (id) url.searchParams.set('dlgId', id);
      window.history.pushState({}, '', url.toString());
    }
  };
}
