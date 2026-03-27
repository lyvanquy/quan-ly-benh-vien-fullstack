import { useQuery } from 'react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

export function usePermissions() {
  const { user } = useAuthStore();

  const { data: permissions = [] } = useQuery<string[]>(
    ['permissions', user?.id],
    () => api.get('/permissions/me').then(r => r.data.data),
    { enabled: !!user, staleTime: 60_000 }
  );

  const can = (key: string) => permissions.includes(key);
  const canAny = (...keys: string[]) => keys.some(k => permissions.includes(k));
  const canAll = (...keys: string[]) => keys.every(k => permissions.includes(k));

  return { permissions, can, canAny, canAll };
}
