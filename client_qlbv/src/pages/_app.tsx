import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import '@/styles/globals.css';
import EntityDialogRenderer from '@/components/EntityDialogRenderer';
import GlobalSearch from '@/components/GlobalSearch';
import { useEntityDialog, EntityType } from '@/store/entityDialogStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function DeepLinkHandler() {
  const router = useRouter();
  const push = useEntityDialog((s) => s.push);
  const stack = useEntityDialog((s) => s.stack);

  useEffect(() => {
    if (!router.isReady || stack.length > 0) return;
    const dlg = router.query.dlg as string | undefined;
    const dlgId = router.query.dlgId as string | undefined;
    if (dlg) push({ entity: dlg as EntityType, id: dlgId, mode: 'view' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
      <DeepLinkHandler />
      <EntityDialogRenderer />
      <GlobalSearch />
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', fontSize: '13px' } }} />
    </QueryClientProvider>
  );
}
