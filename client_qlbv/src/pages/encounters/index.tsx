import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { Plus, Stethoscope, ArrowRight } from 'lucide-react';
import EntityDialogLink from '@/components/EntityDialogLink';
import StatusBadge from '@/components/StatusBadge';

const STATUS_LABEL: Record<string, string> = {
  REGISTERED: 'Tiep nhan', TRIAGED: 'Da phan loai', IN_PROGRESS: 'Dang kham',
  ADMITTED: 'Noi tru', DISCHARGED: 'Da xuat vien', TRANSFERRED: 'Chuyen vien', CANCELLED: 'Huy',
};
const STATUS_COLOR: Record<string, string> = {
  REGISTERED: 'bg-blue-100 text-blue-700', TRIAGED: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-green-100 text-green-700', ADMITTED: 'bg-purple-100 text-purple-700',
  DISCHARGED: 'bg-gray-100 text-gray-600', TRANSFERRED: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
const TYPE_LABEL: Record<string, string> = {
  OUTPATIENT: 'Ngoai tru', INPATIENT: 'Noi tru', EMERGENCY: 'Cap cuu',
  DAY_SURGERY: 'Phau thuat ngay', TELEMEDICINE: 'Tu xa',
};

export default function EncountersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ patientId: '', type: 'OUTPATIENT', chiefComplaint: '' });

  const { data: encountersData, isLoading } = useQuery('encounters', () =>
    api.get('/encounters').then(r => r.data.data));
  const encounters = encountersData?.encounters || encountersData || [];
  const { data: patients = [] } = useQuery('encounters-patients', () =>
    api.get('/patients?limit=200').then(r => {
      const d = r.data.data;
      return Array.isArray(d) ? d : (d?.patients ?? []);
    }));

  const create = useMutation(
    (d: typeof form) => api.post('/encounters', d).then(r => r.data),
    { onSuccess: () => { qc.invalidateQueries('encounters'); setOpen(false); setForm({ patientId: '', type: 'OUTPATIENT', chiefComplaint: '' }); } }
  );

  const updateStatus = useMutation(
    ({ id, status }: { id: string; status: string }) => api.patch(`/encounters/${id}/status`, { status }),
    { onSuccess: () => qc.invalidateQueries('encounters') }
  );

  const NEXT_STATUS: Record<string, { label: string; next: string; color: string }> = {
    REGISTERED:  { label: 'Phan loai', next: 'TRIAGED',     color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
    TRIAGED:     { label: 'Bat dau kham', next: 'IN_PROGRESS', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
    IN_PROGRESS: { label: 'Nhap vien', next: 'ADMITTED',    color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
    ADMITTED:    { label: 'Xuat vien', next: 'DISCHARGED',  color: 'bg-gray-50 text-gray-700 hover:bg-gray-100' },
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dot dieu tri</h1>
          <p className="text-gray-500 text-sm mt-1">Quan ly cac dot kham va dieu tri</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tao dot moi
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">Dang tai...</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Ma dot', 'Benh nhan', 'Loai', 'Trang thai', 'Khoa', 'Ngay tao', 'Hanh dong'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {encounters.map((e: Record<string, unknown>) => (
                <tr key={e.id as string} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    <EntityDialogLink entity="encounter" id={e.id as string}>{(e.encounterCode as string)?.slice(-8)}</EntityDialogLink>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <EntityDialogLink entity="patient" id={(e.patient as Record<string, string>)?.id}>{(e.patient as Record<string, string>)?.name}</EntityDialogLink>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{TYPE_LABEL[e.type as string] || e.type as string}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.status as string} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{(e.department as Record<string, string>)?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(e.createdAt as string).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    {NEXT_STATUS[e.status as string] && (
                      <button
                        onClick={() => updateStatus.mutate({ id: e.id as string, status: NEXT_STATUS[e.status as string].next })}
                        className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${NEXT_STATUS[e.status as string].color}`}>
                        <ArrowRight size={11} />{NEXT_STATUS[e.status as string].label}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {encounters.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  <Stethoscope size={32} className="mx-auto mb-2 opacity-30" />Chua co dot dieu tri nao
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Tao dot dieu tri moi">
        <div className="space-y-4">
          <div>
            <label className="label">Benh nhan</label>
            <select className="input" value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}>
              <option value="">-- Chon benh nhan --</option>
              {(patients as Record<string, string>[]).map((p) => (
                <option key={p.id} value={p.id}>{p.name} - {p.phone}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Loai dot</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Ly do kham</label>
            <textarea className="input" rows={3} value={form.chiefComplaint}
              onChange={e => setForm(f => ({ ...f, chiefComplaint: e.target.value }))} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button className="btn-secondary" onClick={() => setOpen(false)}>Huy</button>
            <button className="btn-primary" onClick={() => create.mutate(form)} disabled={!form.patientId || create.isLoading}>
              {create.isLoading ? 'Dang luu...' : 'Tao dot'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
