import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Plus, Search, FlaskConical, CheckCircle, Clock } from 'lucide-react';
import EntityDialogLink from '@/components/EntityDialogLink';

interface LabOrder {
  id: string; status: string; note: string; createdAt: string; completedAt: string | null;
  patient: { id: string; name: string; patientCode: string };
  items: { id: string; test: { name: string; code: string }; result: string | null; isAbnormal: boolean }[];
}

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:     { label: 'Cho xu ly',  cls: 'badge-yellow' },
  IN_PROGRESS: { label: 'Dang xu ly', cls: 'badge-blue' },
  COMPLETED:   { label: 'Hoan thanh', cls: 'badge-green' },
  CANCELLED:   { label: 'Da huy',     cls: 'badge-red' },
};

export default function LabPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const { data, isLoading } = useQuery(
    ['lab-orders', search, statusFilter],
    () => api.get('/lab/orders', { params: { search: search || undefined, status: statusFilter || undefined } }).then(r => r.data.data)
  );

  const createMutation = useMutation(
    (d: unknown) => api.post('/lab/orders', d),
    { onSuccess: () => { qc.invalidateQueries('lab-orders'); toast.success('Tao phieu xet nghiem thanh cong'); setShowAdd(false); reset(); } }
  );

  const completeMutation = useMutation(
    (id: string) => api.patch(`/lab/orders/${id}/complete`),
    { onSuccess: () => { qc.invalidateQueries('lab-orders'); toast.success('Cap nhat trang thai thanh cong'); } }
  );

  const columns = [
    { key: 'patient', label: 'Benh nhan', render: (r: LabOrder) => (
      <EntityDialogLink entity="patient" id={r.patient?.id}>
        <div><p className="font-medium text-sm">{r.patient?.name}</p><p className="text-xs text-gray-400">{r.patient?.patientCode}</p></div>
      </EntityDialogLink>
    )},
    { key: 'items', label: 'Xet nghiem', render: (r: LabOrder) => (
      <div className="flex flex-wrap gap-1">
        {r.items?.slice(0, 3).map(it => (
          <span key={it.id} className={`text-xs px-1.5 py-0.5 rounded ${it.isAbnormal ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{it.test?.code}</span>
        ))}
        {(r.items?.length ?? 0) > 3 && <span className="text-xs text-gray-400">+{r.items.length - 3}</span>}
      </div>
    )},
    { key: 'status', label: 'Trang thai', render: (r: LabOrder) => {
      const s = STATUS[r.status] ?? { label: r.status, cls: 'badge-gray' };
      return <span className={`badge ${s.cls}`}>{s.label}</span>;
    }},
    { key: 'createdAt', label: 'Ngay tao', render: (r: LabOrder) => new Date(r.createdAt).toLocaleDateString('vi-VN') },
    { key: 'completedAt', label: 'Hoan thanh', render: (r: LabOrder) => r.completedAt ? new Date(r.completedAt).toLocaleDateString('vi-VN') : '-' },
    { key: 'actions', label: '', render: (r: LabOrder) => r.status === 'IN_PROGRESS' ? (
      <button onClick={() => completeMutation.mutate(r.id)} className="text-green-600 hover:underline text-xs flex items-center gap-1"><CheckCircle size={12} /> Hoan thanh</button>
    ) : null },
  ];

  const orders: LabOrder[] = data?.orders ?? [];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Xet nghiem</h1>
          <p className="text-gray-500 text-sm mt-1">Quan ly phieu xet nghiem</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Tao phieu XN</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg"><Clock size={18} className="text-yellow-600" /></div>
          <div><p className="text-xs text-gray-500">Cho xu ly</p><p className="text-xl font-bold">{orders.filter(o => o.status === 'PENDING').length}</p></div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><FlaskConical size={18} className="text-blue-600" /></div>
          <div><p className="text-xs text-gray-500">Dang xu ly</p><p className="text-xl font-bold">{orders.filter(o => o.status === 'IN_PROGRESS').length}</p></div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg"><CheckCircle size={18} className="text-green-600" /></div>
          <div><p className="text-xs text-gray-500">Hoan thanh</p><p className="text-xl font-bold">{orders.filter(o => o.status === 'COMPLETED').length}</p></div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Tim benh nhan..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tat ca</option>
            <option value="PENDING">Cho xu ly</option>
            <option value="IN_PROGRESS">Dang xu ly</option>
            <option value="COMPLETED">Hoan thanh</option>
            <option value="CANCELLED">Da huy</option>
          </select>
          <span className="text-sm text-gray-500">Tong: {data?.total ?? 0}</span>
        </div>
        <Table columns={columns as never} data={orders} loading={isLoading} />
      </div>

      <Modal open={showAdd} onClose={() => { setShowAdd(false); reset(); }} title="Tao phieu xet nghiem">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-3">
          <div><label className="label">Ma benh nhan *</label><input className="input" placeholder="Nhap ID benh nhan" {...register('patientId', { required: true })} /></div>
          <div><label className="label">Ghi chu</label><textarea className="input" rows={2} {...register('note')} /></div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setShowAdd(false); reset(); }} className="btn-secondary">Huy</button>
            <button type="submit" disabled={createMutation.isLoading} className="btn-primary">{createMutation.isLoading ? 'Dang luu...' : 'Tao phieu'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
