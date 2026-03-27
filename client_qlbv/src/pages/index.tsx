import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();
  useEffect(() => { router.replace(user ? '/dashboard' : '/login'); }, [user, router]);
  return null;
}
