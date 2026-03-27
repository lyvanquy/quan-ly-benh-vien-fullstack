import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Eye, ToggleLeft, ToggleRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const SAMPLE_FLOW = {
  key: 'my_flow',
  title: 'Flow mới',
  description: 'Mô tả flow',
  nodes: [
    {
      key: 'start',
      type: 'TEXT',
      title: 'Bắt đầu',
      content: { text: 'Nội dung node đầu tiên' },
      order: 0,
    },
    {
      key: 'question_1',
      type: 'QUESTION',
      title: 'Câu hỏi 1',
      content: { text: 'Bạn có triệu chứng gì?' },
      order: 1,
      options: [
        { label: 'Sốt', value: 'fever', order: 0 },
        { label: 'Ho', value: 'cough', order: 1 },
        { label: 'Khác', value: 'other', order: 2 },
      ],
    },
  ],
};

export default function DialogAdminPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [jsonValue, setJsonValue] = useState(JSON.stringify(SAMPLE_FLOW, null, 2));
  const [jsonError, setJsonError] = useState('');

  const { data: flows = [], isLoading } = useQuery('flows', () => api.get('/dialogs').then(r => r.data.data));

  const createMutation = useMutation(
    (data: unknown) => api.post('/dialogs', data),
    {
      onSuccess: () => { qc.invalidateQueries('flows'); toast.success('Tạo flow thành công'); setShowCreate(false); },
      onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Lỗi'),
    }
  );

  const toggleMutation = useMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) => api.put(`/dialogs/${id}`, { isActive }),
    { onSuccess: () => qc.invalidateQueries('flows') }
  );

  const deleteMutation = useMutation(
    (id: string) => api.delete(`/dialogs/${id}`),
    { onSuccess: () => { qc.invalidateQueries('flows'); toast.success('Đã xóa'); } }
  );

  const handleCreate = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      setJsonError('');
      createMutation.mutate(parsed);
    } catch {
      setJsonError('JSON không hợp lệ');
    }
  };

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dialogs" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Dialog Flows</h1>
          <p className="text-gray-500 text-sm mt-1">Tạo và chỉnh sửa luồng hỏi-đáp</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tạo flow mới
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : (
        <div className="card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Key</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Tên</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Nodes</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Sessions</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Trạng thái</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {flows.map((f: { id: string; key: string; title: string; isActive: boolean; _count: { nodes: number; sessions: number } }) => (
                <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{f.key}</td>
                  <td className="py-3 px-4 font-medium">{f.title}</td>
                  <td className="py-3 px-4">{f._count.nodes}</td>
                  <td className="py-3 px-4">{f._count.sessions}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => toggleMutation.mutate({ id: f.id, isActive: !f.isActive })}
                      className={`flex items-center gap-1 text-xs font-medium ${f.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      {f.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {f.isActive ? 'Bật' : 'Tắt'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/dialogs`} className="text-primary hover:text-primary-dark"><Eye size={16} /></Link>
                      <button onClick={() => { if (confirm('Xóa flow này?')) deleteMutation.mutate(f.id); }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Tạo flow mới (JSON)" size="lg">
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Nhập cấu trúc flow dưới dạng JSON. Xem mẫu bên dưới.</p>
          <textarea
            className="input font-mono text-xs"
            rows={20}
            value={jsonValue}
            onChange={(e) => { setJsonValue(e.target.value); setJsonError(''); }}
          />
          {jsonError && <p className="text-red-500 text-xs">{jsonError}</p>}
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowCreate(false)} className="btn-secondary">Hủy</button>
            <button onClick={handleCreate} disabled={createMutation.isLoading} className="btn-primary">
              {createMutation.isLoading ? 'Đang tạo...' : 'Tạo flow'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
