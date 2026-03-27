/**
 * EntityRelationTabs
 * Auto-renders relation tabs for any entity based on entityMeta graph.
 * Each tab shows a list of related records, each clickable as a dialog link.
 */
import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '@/lib/axios';
import { getEntityRelations, getEntityMeta } from '@/meta/entityMeta';
import EntityDialogLink from './EntityDialogLink';
import { EntityType } from '@/store/entityDialogStore';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  entity: string;
  id: string;
}

function RelationList({ entity, filterField, filterId, createCtxKey }: {
  entity: string;
  filterField: string;
  filterId: string;
  createCtxKey?: string;
}) {
  const meta = getEntityMeta(entity);
  const apiPath = meta?.apiPath || `/${entity}s`;

  const { data, isLoading } = useQuery(
    ['relation', entity, filterField, filterId],
    () => api.get(apiPath, { params: { [filterField]: filterId, limit: 30 } }).then(r => {
      const d = r.data.data;
      // handle various response shapes
      if (Array.isArray(d)) return d;
      const key = Object.keys(d).find(k => Array.isArray(d[k]));
      return key ? d[key] : [];
    }),
    { enabled: !!filterId, staleTime: 30_000 }
  );

  const rows: Record<string, unknown>[] = data || [];

  const displayValue = (row: Record<string, unknown>) => {
    const df = meta?.displayField || 'name';
    if (row[df]) return String(row[df]);
    if (row.name) return String(row.name);
    if (row.code) return String(row.code);
    if (row.procedureName) return String(row.procedureName);
    if (row.reason) return String(row.reason);
    return String(row.id).slice(0, 8).toUpperCase();
  };

  const subValue = (row: Record<string, unknown>) => {
    if (row.createdAt) return format(new Date(row.createdAt as string), 'dd/MM/yyyy HH:mm');
    if (row.appointmentDate) return format(new Date(row.appointmentDate as string), 'dd/MM/yyyy HH:mm');
    if (row.scheduledStart) return format(new Date(row.scheduledStart as string), 'dd/MM/yyyy HH:mm');
    return undefined;
  };

  const statusValue = (row: Record<string, unknown>) =>
    (row.status || row.paymentStatus) as string | undefined;

  const STATUS_COLOR: Record<string, string> = {
    PENDING: 'badge-pending', CONFIRMED: 'badge-confirmed', COMPLETED: 'badge-completed',
    CANCELLED: 'badge-cancelled', PAID: 'badge-completed', UNPAID: 'badge-pending',
    IN_PROGRESS: 'badge-info', ACTIVE: 'badge-confirmed',
  };

  if (isLoading) {
    return (
      <div className="space-y-2 pt-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-12 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {createCtxKey && (
        <div className="flex justify-end mb-3">
          <EntityDialogLink
            entity={entity as EntityType}
            mode="create"
            ctx={{ [createCtxKey]: filterId }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white rounded-xl text-xs font-medium no-underline hover:bg-primary-600"
          >
            <Plus size={12} /> Them moi
          </EntityDialogLink>
        </div>
      )}
      {rows.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">Chua co du lieu</div>
      ) : (
        <div className="space-y-1.5">
          {rows.map((row) => (
            <EntityDialogLink
              key={row.id as string}
              entity={entity as EntityType}
              id={row.id as string}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-primary-50/40 no-underline group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600 truncate">
                  {displayValue(row)}
                </p>
                {subValue(row) && <p className="text-xs text-gray-400 mt-0.5">{subValue(row)}</p>}
              </div>
              {statusValue(row) && (
                <span className={`badge ml-2 shrink-0 ${STATUS_COLOR[statusValue(row)!] || 'badge-info'}`}>
                  {statusValue(row)}
                </span>
              )}
            </EntityDialogLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EntityRelationTabs({ entity, id }: Props) {
  const relations = getEntityRelations(entity);
  const [activeTab, setActiveTab] = useState(0);

  if (relations.length === 0) return null;

  const rel = relations[activeTab];

  return (
    <div className="mt-6">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto mb-4">
        {relations.map((r, i) => (
          <button
            key={r.entity}
            onClick={() => setActiveTab(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              i === activeTab ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <RelationList
        entity={rel.entity}
        filterField={rel.field}
        filterId={id}
        createCtxKey={rel.createCtxKey}
      />
    </div>
  );
}
