import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { Plus, Scissors } from 'lucide-react';
import EntityDialogLink from '@/components/EntityDialogLink';
import StatusBadge from '@/components/StatusBadge';

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700', IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Da len lich', IN_PROGRESS: 'Dang phau thuat',
  COMPLETED: 'Hoan thanh', CANCELLED: 'Huy',
};

export default function SurgeryPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    patientId: '', surgeonId: '', orId: '',
    procedureName: '', scheduledStart: '', scheduledEnd: '', anesthesiaType: '',
  });

  const { data: surgeries = [], isLoading } = useQuery('surgeries', () =>
    api.get('/surgery').then(r => r.data.data));
  const { data: patients = [] } = useQuery('surgery-patients-list', () =>
    api.get('/patients?limit=200').then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.patients ?? []); }));
  const { data: doctors = [] } = useQuery('surgery-doctors-list', () =>
    api.get('/doctors').then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.doctors ?? []); }));
  const { data: ors = [] } = useQuery('surgery-or-list', () =>
    api.get('/surgery/operating-rooms').then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.operatingRooms ?? d ?? []); }));

  const create = useMutation(
    (d: typeof form) => api.post('/surgery', d).then(r => r.data),
    { onSuccess: () => { qc.invalidateQueries('surgeries'); setOpen(false); } }
  );

  const NEXT_STATUS: Record<string, { label: string; next: string; cls: string }> = {
    SCHEDULED: { label: 'Bat dau PT', next: 'IN_PROGRESS', cls: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
    IN_PROGRESS: { label: 'Hoan thanh', next: 'COMPLETED', cls: 'bg-green-50 text-green-700 hover:bg-green-100' },
  };

  const updateStatus = useMutation(
    ({ id, status }: { id: string; status: string }) => api.put(`/surgery/${id}`, { status }),
    { onSuccess: () => qc.invalidateQueries('surgeries') }
  );

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lich phau thuat</h1>
          <p className="text-gray-500 text-sm mt-1">Quan ly phong mo va lich phau thuat</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Len lich PT
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">Dang tai...</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Benh nhan', 'Thu thuat', 'Bac si phau thuat', 'Phong mo', 'Bat dau', 'Ket thuc', 'Trang thai', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(surgeries as Record<string, unknown>[]).map((s) => (
                <tr key={s.id as string} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <EntityDialogLink entity="patient" id={(s.patient as Record<string, string>)?.id}>{(s.patient as Record<string, string>)?.name}</EntityDialogLink>
                  </td>
                  <td className="px-4 py-3">
                    <EntityDialogLink entity="surgery" id={s.id as string}>{s.procedureName as string}</EntityDialogLink>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <EntityDialogLink entity="doctor" id={(s.surgeon as Record<string, string>)?.id}>{(s.surgeon as Record<string, Record<string, string>>)?.user?.name}</EntityDialogLink>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{(s.or as Record<string, string>)?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(s.scheduledStart as string).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(s.scheduledEnd as string).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status as string} size="md" />
                  </td>
                  <td className="px-4 py-3">
                    {NEXT_STATUS[s.status as string] && (
                      <button
                        onClick={() => updateStatus.mutate({ id: s.id as string, status: NEXT_STATUS[s.status as string].next })}
                        className={`text-xs px-2 py-1 rounded ${NEXT_STATUS[s.status as string].cls}`}>
                        {NEXT_STATUS[s.status as string].label}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(surgeries as unknown[]).length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  <Scissors size={32} className="mx-auto mb-2 opacity-30" />Chua co lich phau thuat
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Len lich phau thuat">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Benh nhan</label>
              <select className="input" value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}>
                <option value="">-- Chon --</option>
                {(patients as Record<string, string>[]).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Bac si phau thuat</label>
              <select className="input" value={form.surgeonId} onChange={e => setForm(f => ({ ...f, surgeonId: e.target.value }))}>
                <option value="">-- Chon --</option>
                {(doctors as Record<string, unknown>[]).map((d) => (
                  <option key={d.id as string} value={d.id as string}>{(d.user as Record<string, string>)?.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phong mo</label>
              <select className="input" value={form.orId} onChange={e => setForm(f => ({ ...f, orId: e.target.value }))}>
                <option value="">-- Chon --</option>
                {(ors as Record<string, string>[]).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Ten thu thuat</label>
              <input className="input" value={form.procedureName} onChange={e => setForm(f => ({ ...f, procedureName: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Bat dau</label>
              <input type="datetime-local" className="input" value={form.scheduledStart} onChange={e => setForm(f => ({ ...f, scheduledStart: e.target.value }))} />
            </div>
            <div>
              <label className="label">Ket thuc du kien</label>
              <input type="datetime-local" className="input" value={form.scheduledEnd} onChange={e => setForm(f => ({ ...f, scheduledEnd: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Loai gay me</label>
            <input className="input" placeholder="Toan than / Tai cho / Tuy song..." value={form.anesthesiaType} onChange={e => setForm(f => ({ ...f, anesthesiaType: e.target.value }))} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button className="btn-secondary" onClick={() => setOpen(false)}>Huy</button>
            <button className="btn-primary" onClick={() => create.mutate(form)} disabled={create.isLoading}>
              {create.isLoading ? 'Dang luu...' : 'Len lich'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
