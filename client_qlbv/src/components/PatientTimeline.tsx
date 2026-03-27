import { useQuery } from 'react-query';
import api from '@/lib/axios';
import EntityDialogLink from './EntityDialogLink';
import { EntityType } from '@/store/entityDialogStore';
import { format } from 'date-fns';
import { CalendarDays, Stethoscope, FlaskConical, Receipt, Scissors, ArrowRightLeft, Clock } from 'lucide-react';

interface TimelineEvent {
  entity: string;
  id: string;
  label: string;
  sub?: string;
  date: string;
  status?: string;
}

const ENTITY_ICON: Record<string, React.ElementType> = {
  appointment: CalendarDays,
  encounter:   Stethoscope,
  lab_order:   FlaskConical,
  bill:        Receipt,
  surgery:     Scissors,
  referral:    ArrowRightLeft,
};

const ENTITY_COLOR: Record<string, string> = {
  appointment: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  encounter:   'bg-purple-100 text-purple-600 border-purple-200',
  lab_order:   'bg-teal-100 text-teal-600 border-teal-200',
  bill:        'bg-amber-100 text-amber-600 border-amber-200',
  surgery:     'bg-red-100 text-red-600 border-red-200',
  referral:    'bg-cyan-100 text-cyan-600 border-cyan-200',
};

const LINE_COLOR: Record<string, string> = {
  appointment: 'bg-indigo-400',
  encounter:   'bg-purple-400',
  lab_order:   'bg-teal-400',
  bill:        'bg-amber-400',
  surgery:     'bg-red-400',
  referral:    'bg-cyan-400',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING:    'badge-pending',
  CONFIRMED:  'badge-confirmed',
  COMPLETED:  'badge-completed',
  CANCELLED:  'badge-cancelled',
  PAID:       'badge-completed',
  UNPAID:     'badge-pending',
  IN_PROGRESS:'badge-info',
};

export default function PatientTimeline({ patientId }: { patientId: string }) {
  const { data: events = [], isLoading } = useQuery<TimelineEvent[]>(
    ['timeline', patientId],
    () => api.get(`/timeline/patient/${patientId}`).then(r => r.data.data),
    { enabled: !!patientId, staleTime: 30_000 }
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="skeleton w-8 h-8 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3.5 w-48 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-10">
        <Clock size={28} className="text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">Chua co lich su dieu tri</p>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, TimelineEvent[]> = {};
  events.forEach(e => {
    const day = format(new Date(e.date), 'dd/MM/yyyy');
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(e);
  });

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([day, dayEvents]) => (
        <div key={day}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs font-semibold text-gray-400 px-2">{day}</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="space-y-2">
            {dayEvents.map((event, i) => {
              const Icon = ENTITY_ICON[event.entity] || Clock;
              const colorClass = ENTITY_COLOR[event.entity] || 'bg-gray-100 text-gray-600 border-gray-200';
              const lineColor = LINE_COLOR[event.entity] || 'bg-gray-300';
              const isLast = i === dayEvents.length - 1;

              return (
                <div key={event.id} className="flex gap-3 group">
                  {/* Timeline line + icon */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${colorClass}`}>
                      <Icon size={14} />
                    </div>
                    {!isLast && <div className={`w-0.5 flex-1 mt-1 ${lineColor} opacity-30`} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <EntityDialogLink
                          entity={event.entity as EntityType}
                          id={event.id}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600 no-underline block truncate"
                        >
                          {event.label}
                        </EntityDialogLink>
                        {event.sub && <p className="text-xs text-gray-400 mt-0.5">{event.sub}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {event.status && (
                          <span className={`badge text-[10px] ${STATUS_BADGE[event.status] || 'badge-info'}`}>
                            {event.status}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-300">
                          {format(new Date(event.date), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
