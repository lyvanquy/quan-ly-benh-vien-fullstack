import { create } from 'zustand';

export interface CommandItem {
  id: string;
  label: string;
  sub?: string;
  icon?: string;
  action: () => void;
  group: 'entity' | 'create' | 'navigate' | 'search';
}

interface CommandState {
  open: boolean;
  query: string;
  setOpen: (v: boolean) => void;
  setQuery: (v: string) => void;
  toggle: () => void;
}

export const useCommandStore = create<CommandState>((set) => ({
  open: false,
  query: '',
  setOpen: (v) => set({ open: v, query: '' }),
  setQuery: (q) => set({ query: q }),
  toggle: () => set((s) => ({ open: !s.open, query: '' })),
}));
