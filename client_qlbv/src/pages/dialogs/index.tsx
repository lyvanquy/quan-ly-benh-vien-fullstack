import { useState } from 'react';
import { useQuery } from 'react-query';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import DialogPlayer from '@/components/DialogPlayer';
import api from '@/lib/axios';
import { Play, Settings, GitBranch } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Flow {
  id: string; key: string; title: string; description: string;
  isActive: boolean; createdAt: string;
  _count: { nodes: number; sessions: number };
}

export default function DialogsPage() {
  const [activeFlow, setActiveFlow] = useState<Flow | null>(null);
  const { data: flows = [], isLoading } = useQuery('flows', () => api.get('/dialogs').then(r => r.data.data));

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dialog Flows</h1>
          <p className="text-gray-500 text-sm mt-1">Luồng hỏi-đáp và phân loại bệnh nhân</p>
        </div>
        <Link href="/dialogs/admin" className="btn-primary flex items-center gap-2">
          <Settings size={16} /> Quản lý flows
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {flows.map((flow: Flow) => (
            <div key={flow.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <GitBranch size={18} className="text-primary" />
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${flow.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {flow.isActive ? 'Hoạt động' : 'Tắt'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">{flow.title}</h3>
              <p className="text-sm text-gray-500 mt-1 mb-3">{flow.description || 'Không có mô tả'}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                <span>{flow._count.nodes} nodes</span>
                <span>{flow._count.sessions} sessions</span>
                <span>{format(new Date(flow.createdAt), 'dd/MM/yyyy')}</span>
              </div>
              <button
                onClick={() => setActiveFlow(flow)}
                disabled={!flow.isActive}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-40"
              >
                <Play size={14} /> Chạy flow
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!activeFlow}
        onClose={() => setActiveFlow(null)}
        title={activeFlow?.title || ''}
        size="md"
      >
        {activeFlow && (
          <DialogPlayer
            flowKey={activeFlow.key}
            onComplete={() => setTimeout(() => setActiveFlow(null), 2000)}
          />
        )}
      </Modal>
    </Layout>
  );
}
