import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import WorkflowRenderer from '@/components/WorkflowRenderer';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Plus, Play, Pencil, Trash2, GitBranch, ToggleLeft, ToggleRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Workflow {
  id: string; key: string; title: string; description: string;
  isActive: boolean; version: number; createdAt: string;
  _count: { nodes: number; sessions: number };
}

const SAMPLE_WF = {
  key: 'hospital_visit',
  title: 'Luồng khám bệnh',
  description: 'Checkin → Triệu chứng → Khám bác sĩ → Xét nghiệm → Kê đơn → Thanh toán',
  nodes: [
    { key: 'checkin', type: 'FORM', title: 'Checkin bệnh nhân', order: 0, posX: 50, posY: 100,
      config: { schema: { fields: [{ name: 'reason', label: 'Lý do khám', type: 'text', required: true }, { name: 'priority', label: 'Mức độ ưu tiên', type: 'text', options: ['Thường', 'Khẩn', 'Cấp cứu'], required: true }] } } },
    { key: 'symptom', type: 'FORM', title: 'Triệu chứng', order: 1, posX: 300, posY: 100,
      config: { schema: { fields: [{ name: 'symptom', label: 'Triệu chứng chính', type: 'text', required: true }, { name: 'duration', label: 'Thời gian (ngày)', type: 'number' }, { name: 'temperature', label: 'Nhiệt độ (°C)', type: 'number' }] } } },
    { key: 'triage', type: 'DIALOG', title: 'Phân loại', order: 2, posX: 550, posY: 100,
      config: { text: 'Bệnh nhân cần xét nghiệm không?' },
      options: [{ label: 'Có, cần xét nghiệm', value: 'yes', order: 0 }, { label: 'Không, khám trực tiếp', value: 'no', order: 1 }] },
    { key: 'lab_order', type: 'FORM', title: 'Yêu cầu xét nghiệm', order: 3, posX: 400, posY: 280,
      config: { schema: { fields: [{ name: 'tests', label: 'Loại xét nghiệm', type: 'text', required: true }, { name: 'urgent', label: 'Khẩn cấp?', type: 'text', options: ['Có', 'Không'] }] } } },
    { key: 'doctor_exam', type: 'TEXT', title: 'Chuyển khám bác sĩ', order: 4, posX: 700, posY: 280,
      config: { text: 'Bệnh nhân được chuyển vào phòng khám. Vui lòng chờ bác sĩ gọi tên.' } },
    { key: 'prescription', type: 'FORM', title: 'Kê đơn thuốc', order: 5, posX: 950, posY: 280,
      config: { schema: { fields: [{ name: 'diagnosis', label: 'Chẩn đoán', type: 'text', required: true }, { name: 'medicines', label: 'Thuốc kê đơn', type: 'text' }] } } },
    { key: 'billing', type: 'TEXT', title: 'Thanh toán', order: 6, posX: 1200, posY: 280,
      config: { text: 'Vui lòng đến quầy thanh toán để hoàn tất thủ tục.' } },
  ],
  edges: [
    { fromNodeKey: 'checkin', toNodeKey: 'symptom' },
    { fromNodeKey: 'symptom', toNodeKey: 'triage' },
    { fromNodeKey: 'triage', toNodeKey: 'lab_order', label: 'yes' },
    { fromNodeKey: 'triage', toNodeKey: 'doctor_exam', label: 'no' },
    { fromNodeKey: 'lab_order', toNodeKey: 'doctor_exam' },
    { fromNodeKey: 'doctor_exam', toNodeKey: 'prescription' },
    { fromNodeKey: 'prescription', toNodeKey: 'billing' },
  ],
};

export default function WorkflowsPage() {
  const qc = useQueryClient();
  const [activeWF, setActiveWF] = useState<Workflow | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [jsonValue, setJsonValue] = useState(JSON.stringify(SAMPLE_WF, null, 2));
  const [jsonError, setJsonError] = useState('');

  const { data: workflows = [], isLoading } = useQuery('workflows', () => api.get('/workflows').then(r => r.data.data));

  const createMutation = useMutation(
    (data: unknown) => api.post('/workflows', data),
    { onSuccess: () => { qc.invalidateQueries('workflows'); toast.success('Tạo workflow thành công'); setShowCreate(false); } }
  );

  const toggleMutation = useMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) => api.put(`/workflows/${id}`, { isActive }),
    { onSuccess: () => qc.invalidateQueries('workflows') }
  );

  const deleteMutation = useMutation(
    (id: string) => api.delete(`/workflows/${id}`),
    { onSuccess: () => { qc.invalidateQueries('workflows'); toast.success('Đã xóa'); } }
  );

  const handleCreate = () => {
    try { const parsed = JSON.parse(jsonValue); setJsonError(''); createMutation.mutate(parsed); }
    catch { setJsonError('JSON không hợp lệ'); }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Engine</h1>
          <p className="text-gray-500 text-sm mt-1">Luồng xử lý động — kết nối các bước khám bệnh</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus size={16} />Tạo workflow</button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {workflows.map((wf: Workflow) => (
            <div key={wf.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <GitBranch size={18} className="text-indigo-500" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">v{wf.version}</span>
                  <button onClick={() => toggleMutation.mutate({ id: wf.id, isActive: !wf.isActive })}
                    className={wf.isActive ? 'text-green-500' : 'text-gray-300'}>
                    {wf.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">{wf.title}</h3>
              <p className="text-xs text-gray-500 mt-1 mb-3 line-clamp-2">{wf.description}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                <span>{wf._count.nodes} nodes</span>
                <span>{wf._count.sessions} sessions</span>
                <span>{format(new Date(wf.createdAt), 'dd/MM/yy')}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveWF(wf)} disabled={!wf.isActive}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm disabled:opacity-40">
                  <Play size={13} />Chạy
                </button>
                <Link href={`/workflows/designer/${wf.key}`}
                  className="btn-secondary flex items-center gap-1.5 text-sm px-3">
                  <Pencil size={13} />Designer
                </Link>
                <button onClick={() => { if (confirm('Xóa?')) deleteMutation.mutate(wf.id); }}
                  className="text-red-400 hover:text-red-600 px-2">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Run modal */}
      <Modal open={!!activeWF} onClose={() => setActiveWF(null)} title={activeWF?.title || ''} size="md">
        {activeWF && (
          <WorkflowRenderer
            workflowKey={activeWF.key}
            onComplete={() => setTimeout(() => setActiveWF(null), 2500)}
          />
        )}
      </Modal>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Tạo workflow mới (JSON)" size="lg">
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Định nghĩa workflow bằng JSON. Nodes và edges được tạo tự động.</p>
          <textarea className="input font-mono text-xs" rows={22} value={jsonValue}
            onChange={(e) => { setJsonValue(e.target.value); setJsonError(''); }} />
          {jsonError && <p className="text-red-500 text-xs">{jsonError}</p>}
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Hủy</button>
            <button onClick={handleCreate} disabled={createMutation.isLoading} className="btn-primary">
              {createMutation.isLoading ? 'Đang tạo...' : 'Tạo workflow'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
