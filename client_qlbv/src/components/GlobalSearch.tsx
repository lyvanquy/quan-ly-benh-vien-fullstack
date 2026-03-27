/**
 * GlobalSearch + Command Palette
 * Trigger: Ctrl+K or Cmd+K
 * Features:
 *  - Search patients, doctors, medicines, bills, surgeries
 *  - Quick create commands
 *  - Navigate to pages
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useCommandStore } from '@/store/commandStore';
import { useOpenDialog, EntityType } from '@/store/entityDialogStore';
import api from '@/lib/axios';
import { useRouter } from 'next/router';
import {
  Search, Users, UserRound, Pill, Receipt, Scissors,
  CalendarDays, Plus, LayoutDashboard, X, ArrowRight,
  Stethoscope, FlaskConical, GitBranch,
} from 'lucide-react';

interface SearchResult {
  entity: string;
  id: string;
  label: string;
  sub?: string;
}

const ENTITY_ICON: Record<string, React.ElementType> = {
  patient:     Users,
  doctor:      UserRound,
  medicine:    Pill,
  bill:        Receipt,
  surgery:     Scissors,
  appointment: CalendarDays,
  encounter:   Stethoscope,
  lab_order:   FlaskConical,
};

const ENTITY_COLOR: Record<string, string> = {
  patient:     'text-blue-500 bg-blue-50',
  doctor:      'text-emerald-500 bg-emerald-50',
  medicine:    'text-pink-500 bg-pink-50',
  bill:        'text-amber-500 bg-amber-50',
  surgery:     'text-red-500 bg-red-50',
  appointment: 'text-indigo-500 bg-indigo-50',
  encounter:   'text-purple-500 bg-purple-50',
  lab_order:   'text-teal-500 bg-teal-50',
};

const ENTITY_LABEL: Record<string, string> = {
  patient: 'Benh nhan', doctor: 'Bac si', medicine: 'Thuoc',
  bill: 'Hoa don', surgery: 'Phau thuat', appointment: 'Lich kham',
  encounter: 'Dot dieu tri', lab_order: 'Xet nghiem',
};

const QUICK_CREATES = [
  { label: 'Tao benh nhan moi',  entity: 'patient',     icon: Users },
  { label: 'Dat lich kham',      entity: 'appointment', icon: CalendarDays },
  { label: 'Tao dot dieu tri',   entity: 'encounter',   icon: Stethoscope },
  { label: 'Chi dinh xet nghiem',entity: 'lab_order',   icon: FlaskConical },
  { label: 'Tao hoa don',        entity: 'bill',        icon: Receipt },
];

const NAV_ITEMS = [
  { label: 'Dashboard',    href: '/dashboard',    icon: LayoutDashboard },
  { label: 'Benh nhan',    href: '/patients',     icon: Users },
  { label: 'Bac si',       href: '/doctors',      icon: UserRound },
  { label: 'Lich kham',    href: '/appointments', icon: CalendarDays },
  { label: 'Xet nghiem',   href: '/lab',          icon: FlaskConical },
  { label: 'Hoa don',      href: '/billing',      icon: Receipt },
  { label: 'Workflow',     href: '/workflows',    icon: GitBranch },
];

export default function GlobalSearch() {
  const { open, query, setOpen, setQuery } = useCommandStore();
  const openDialog = useOpenDialog();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);

  // Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setOpen]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelected(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data.data || []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const filteredNav = NAV_ITEMS.filter(n => !query || n.label.toLowerCase().includes(query.toLowerCase()));
  const filteredCreates = QUICK_CREATES.filter(c => !query || c.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelectResult = useCallback((r: SearchResult) => {
    openDialog(r.entity as EntityType, r.id, 'view');
    setOpen(false);
  }, [openDialog, setOpen]);

  const handleSelectCreate = useCallback((entity: string) => {
    openDialog(entity as EntityType, undefined, 'create');
    setOpen(false);
  }, [openDialog, setOpen]);

  const handleNav = useCallback((href: string) => {
    router.push(href);
    setOpen(false);
  }, [router, setOpen]);

  if (!open) return null;

  const showSearch = query.length >= 2;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-dialog overflow-hidden animate-scaleIn">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Tim kiem benh nhan, bac si, thuoc... hoac nhap lenh"
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="btn-icon shrink-0">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-400 font-mono shrink-0">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* Search results */}
          {showSearch && (
            <div className="p-2">
              {loading ? (
                <div className="space-y-1.5 p-2">
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
                </div>
              ) : results.length > 0 ? (
                <>
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Ket qua tim kiem</p>
                  {results.map((r, i) => {
                    const Icon = ENTITY_ICON[r.entity] || Search;
                    const color = ENTITY_COLOR[r.entity] || 'text-gray-500 bg-gray-50';
                    return (
                      <button key={r.id} onClick={() => handleSelectResult(r)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${selected === i ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                          {r.sub && <p className="text-xs text-gray-400 truncate">{r.sub}</p>}
                        </div>
                        <span className="text-[10px] text-gray-300 shrink-0">{ENTITY_LABEL[r.entity] || r.entity}</span>
                        <ArrowRight size={12} className="text-gray-300 shrink-0" />
                      </button>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">Khong tim thay ket qua cho &quot;{query}&quot;</div>
              )}
            </div>
          )}

          {/* Quick creates */}
          {filteredCreates.length > 0 && (
            <div className="p-2 border-t border-gray-50">
              <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Tao moi nhanh</p>
              {filteredCreates.map((c) => {
                const Icon = c.icon;
                return (
                  <button key={c.entity} onClick={() => handleSelectCreate(c.entity)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                      <Plus size={12} className="text-primary-500" />
                    </div>
                    <span className="text-sm text-gray-700">{c.label}</span>
                    <Icon size={13} className="text-gray-300 ml-auto" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Navigation */}
          {filteredNav.length > 0 && (
            <div className="p-2 border-t border-gray-50">
              <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Dieu huong</p>
              {filteredNav.map((n) => {
                const Icon = n.icon;
                return (
                  <button key={n.href} onClick={() => handleNav(n.href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-700">{n.label}</span>
                    <ArrowRight size={12} className="text-gray-300 ml-auto" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-50 bg-gray-50/50">
          <span className="text-[10px] text-gray-400">
            <kbd className="font-mono bg-white border border-gray-200 rounded px-1 py-0.5 text-[9px]">↑↓</kbd> di chuyen
          </span>
          <span className="text-[10px] text-gray-400">
            <kbd className="font-mono bg-white border border-gray-200 rounded px-1 py-0.5 text-[9px]">Enter</kbd> chon
          </span>
          <span className="text-[10px] text-gray-400">
            <kbd className="font-mono bg-white border border-gray-200 rounded px-1 py-0.5 text-[9px]">Esc</kbd> dong
          </span>
          <span className="ml-auto text-[10px] text-gray-300">Ctrl+K</span>
        </div>
      </div>
    </div>
  );
}
