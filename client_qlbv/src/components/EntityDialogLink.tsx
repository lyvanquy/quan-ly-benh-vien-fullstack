import { ReactNode } from 'react';
import { useOpenDialog, EntityType } from '@/store/entityDialogStore';

interface Props {
  entity: EntityType;
  id?: string;
  mode?: 'view' | 'create' | 'edit';
  ctx?: Record<string, unknown>;
  children: ReactNode;
  className?: string;
}

/**
 * Wrap any text/element to make it open an entity dialog on click.
 * Usage:
 *   <EntityDialogLink entity="patient" id={p.id}>{p.name}</EntityDialogLink>
 *   <EntityDialogLink entity="appointment" mode="create" ctx={{ patientId: p.id }}>+ Đặt lịch</EntityDialogLink>
 */
export default function EntityDialogLink({ entity, id, mode = 'view', ctx, children, className = '' }: Props) {
  const open = useOpenDialog();
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => { e.stopPropagation(); open(entity, id, mode, ctx); }}
      onKeyDown={(e) => { if (e.key === 'Enter') open(entity, id, mode, ctx); }}
      className={`cursor-pointer text-primary hover:underline hover:text-primary/80 transition-colors ${className}`}
    >
      {children}
    </span>
  );
}
