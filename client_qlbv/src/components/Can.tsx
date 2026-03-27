import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface Props {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export default function Can({ permission, fallback = null, children }: Props) {
  const { can } = usePermissions();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}
