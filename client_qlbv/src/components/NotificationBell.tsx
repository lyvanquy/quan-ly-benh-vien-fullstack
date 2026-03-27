import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/lib/axios';
import { format } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
  isRead?: boolean;
  link?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  INFO: Info, SUCCESS: CheckCircle, WARNING: AlertTriangle, ERROR: XCircle,
};
const COLOR_MAP: Record<string, { dot: string; bg: string; text: string }> = {
  INFO:    { dot: 'bg-blue-500',    bg: 'bg-blue-50',    text: 'text-blue-500' },
  SUCCESS: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-500' },
  WARNING: { dot: 'bg-amber-500',   bg: 'bg-amber-50',   text: 'text-amber-500' },
  ERROR:   { dot: 'bg-red-500',     bg: 'bg-red-50',     text: 'text-red-500' },
};

export default function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [liveNotifs, setLiveNotifs] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const { on } = useSocket();

  const { data: persisted = [] } = useQuery<Notification[]>(
    'my-notifications',
    () => api.get('/notifications').then(r =>
      (r.data.data || []).map((n: Notification) => ({ ...n, read: n.isRead ?? false }))
    ),
    { staleTime: 30_000, retry: false }
  );

  const markAllMut = useMutation(() => api.put('/notifications/read-all'), {
    onSuccess: () => qc.invalidateQueries('my-notifications'),
  });

  useEffect(() => {
    const off = on('notification', (data: unknown) => {
      const n = data as Omit<Notification, 'read'>;
      setLiveNotifs(prev => [{ ...n, read: false }, ...prev].slice(0, 20));
    });
    return off;
  }, [on]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allNotifs = [...liveNotifs, ...persisted].reduce<Notification[]>((acc, n) => {
    if (!acc.find(x => x.id === n.id)) acc.push(n);
    return acc;
  }, []);

  const unread = allNotifs.filter(n => !n.read).length;

  const markAllRead = () => {
    setLiveNotifs(prev => prev.map(n => ({ ...n, read: true })));
    markAllMut.mutate();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all ${open ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-sm">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 z-[100] overflow-hidden animate-scaleIn origin-top-right">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-gray-500" />
              <span className="font-semibold text-sm text-gray-900">Thong bao</span>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">{unread} moi</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 font-medium px-2 py-1 rounded-lg hover:bg-primary-50 transition-colors">
                  <CheckCheck size={12} /> Doc tat ca
                </button>
              )}
              <button onClick={() => setOpen(false)} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X size={13} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {allNotifs.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                  <Bell size={18} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">Chua co thong bao</p>
              </div>
            ) : allNotifs.map(n => {
              const cfg = COLOR_MAP[n.type] || COLOR_MAP.INFO;
              const IconComp = ICON_MAP[n.type] || Info;
              return (
                <div key={n.id}
                  onClick={() => setLiveNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                      <IconComp size={14} className={cfg.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm truncate ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</p>
                        {!n.read && <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${cfg.dot}`} />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-300 mt-1">{format(new Date(n.createdAt), 'HH:mm dd/MM')}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {allNotifs.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 text-center">
              <p className="text-xs text-gray-400">{allNotifs.length} thong bao</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}