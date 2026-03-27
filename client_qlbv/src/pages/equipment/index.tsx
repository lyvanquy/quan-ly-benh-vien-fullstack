import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { Plus, Wrench, AlertTriangle } from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700',
  RETIRED: 'bg-gray-100 text-gray-500',
};

export default function EquipmentPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [maintModal, setMaintModal] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', category: '', location: '', status: 'ACTIVE' });
  const [maintForm, setMaintForm] = useState({ type: 'PREVENTIVE', description: '', performedBy: '', cost: '' });

  const { data, isLoading } = useQuery('equipments', () => api.get('/equipment').then(r => r.data.data));

  const createMut = useMutation((d: typeof form) => api.post('/equipment', d), {
    onSuccess: () => { qc.invalidateQueries('equipments'); setShowModal(false); },
  });

  const maintMut = useMutation(({ id, data }: { id: string; data: typeof maintForm }) =>
    api.post(`/equipment/${id}/maintenance`, data), {
    onSuccess: () => { qc.invalidateQueries('equipments'); setMaintModal(null); },
  });

  const equipments = data?.equipments || [];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Wrench className="text-primary" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">Quan ly thiet bi</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Them thiet bi
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>{['Ma', 'Ten thiet bi', 'Danh muc', 'Vi tri', 'Trang thai', 'Bao tri cuoi', 'Bao tri tiep theo', 'Hanh dong'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Dang tai...</td></tr>
            ) : equipments.map((e: Record<string, unknown>) => {
              const nextService = e.nextService ? new Date(e.nextService as string) : null;
              const isDue = nextService && nextService < new Date();
              return (
                <tr key={e.id as string} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{e.code as string}</td>
                  <td className="px-4 py-3 font-medium">{e.name as string}</td>
                  <td className="px-4 py-3 text-gray-600">{e.category as string}</td>
                  <td className="px-4 py-3 text-gray-600">{(e.location as string) || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[e.status as string] || 'bg-gray-100 text-gray-600'}`}>{e.status as string}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{e.lastService ? format(new Date(e.lastService as string), 'dd/MM/yyyy') : '-'}</td>
                  <td className="px-4 py-3">
                    {nextService ? (
                      <span className={`flex items-center gap-1 text-xs ${isDue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {isDue && <AlertTriangle size={12} />}
                        {format(nextService, 'dd/MM/yyyy')}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setMaintModal(e.id as string)}
                      className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 flex items-center gap-1">
                      <Wrench size={11} /> Bao tri
                    </button>
                  </td>
                </tr>
              );
            })}
            {!isLoading && !equipments.length && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Chua co thiet bi</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Them thiet bi moi">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Ma thiet bi</label><input className="input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
            <div><label className="label">Ten thiet bi</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Danh muc</label><input className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
            <div><label className="label">Vi tri</label><input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
          </div>
          <div>
            <label className="label">Trang thai</label>
            <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="ACTIVE">Hoat dong</option>
              <option value="MAINTENANCE">Bao tri</option>
              <option value="RETIRED">Ngung su dung</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Huy</button>
            <button onClick={() => createMut.mutate(form)} disabled={createMut.isLoading} className="btn-primary">
              {createMut.isLoading ? 'Dang luu...' : 'Them'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!maintModal} onClose={() => setMaintModal(null)} title="Ghi nhan bao tri">
        <div className="space-y-4">
          <div>
            <label className="label">Loai bao tri</label>
            <select className="input" value={maintForm.type} onChange={e => setMaintForm(f => ({ ...f, type: e.target.value }))}>
              <option value="PREVENTIVE">Phong ngua</option>
              <option value="CORRECTIVE">Sua chua</option>
              <option value="CALIBRATION">Hieu chuan</option>
            </select>
          </div>
          <div><label className="label">Mo ta</label><textarea className="input" rows={3} value={maintForm.description} onChange={e => setMaintForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nguoi thuc hien</label><input className="input" value={maintForm.performedBy} onChange={e => setMaintForm(f => ({ ...f, performedBy: e.target.value }))} /></div>
            <div><label className="label">Chi phi (VND)</label><input type="number" className="input" value={maintForm.cost} onChange={e => setMaintForm(f => ({ ...f, cost: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setMaintModal(null)} className="btn-secondary">Huy</button>
            <button onClick={() => maintModal && maintMut.mutate({ id: maintModal, data: maintForm })}
              disabled={maintMut.isLoading} className="btn-primary">
              {maintMut.isLoading ? 'Dang luu...' : 'Luu'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
