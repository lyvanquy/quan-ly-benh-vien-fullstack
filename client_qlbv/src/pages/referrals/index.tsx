import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { Plus, ArrowRightLeft } from 'lucide-react';
import EntityDialogLink from '@/components/EntityDialogLink';

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  DECLINED: 'bg-red-100 text-red-700',
};

const URGENCY_COLOR: Record<string, string> = {
  ROUTINE: 'bg-gray-100 text-gray-600',
  URGENT: 'bg-orange-100 text-orange-700',
  EMERGENCY: 'bg-red-100 text-red-700',
};

export default function ReferralsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ patientId: '', fromDoctorId: '', toDepartment: '', toFacility: '', reason: '', urgency: 'ROUTINE', note: '' });

  const { data, isLoading } = useQuery('referrals', () => api.get('/referrals').then(r => r.data.data));
  const { data: patientsData } = useQuery('referrals-patients', () =>
    api.get('/patients?limit=200').then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.patients ?? []); }));
  const { data: doctorsData } = useQuery('referrals-doctors', () =>
    api.get('/doctors?limit=200').then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.doctors ?? []); }));

  const createMut = useMutation((d: typeof form) => api.post('/referrals', d), {
    onSuccess: () => { qc.invalidateQueries('referrals'); setShowModal(false); },
  });

  const updateStatus = useMutation(({ id, status }: { id: string; status: string }) =>
    api.put(`/referrals/${id}`, { status }), {
    onSuccess: () => qc.invalidateQueries('referrals'),
  });

  const referrals = data?.referrals || [];
  const patients = Array.isArray(patientsData) ? patientsData : [];
  const doctors = Array.isArray(doctorsData) ? doctorsData : [];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="text-primary" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">Chuyen vien / Chuyen khoa</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tao phieu chuyen
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>{['Benh nhan', 'Bac si chuyen', 'Ly do', 'Chuyen den', 'Muc do', 'Trang thai', 'Ngay tao', 'Hanh dong'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Dang tai...</td></tr>
            ) : referrals.map((r: Record<string, unknown>) => (
              <tr key={r.id as string} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <EntityDialogLink entity="patient" id={(r.patient as Record<string, string>)?.id}>{(r.patient as Record<string, string>)?.name}</EntityDialogLink>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <EntityDialogLink entity="doctor" id={(r.fromDoctor as Record<string, string>)?.id}>{(r.fromDoctor as Record<string, Record<string, string>>)?.user?.name || '-'}</EntityDialogLink>
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{r.reason as string}</td>
                <td className="px-4 py-3 text-gray-600">{(r.toDepartment as string) || (r.toFacility as string) || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${URGENCY_COLOR[r.urgency as string] || 'bg-gray-100 text-gray-600'}`}>{r.urgency as string}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[r.status as string] || 'bg-gray-100 text-gray-600'}`}>{r.status as string}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{format(new Date(r.createdAt as string), 'dd/MM/yyyy')}</td>
                <td className="px-4 py-3">
                  {r.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus.mutate({ id: r.id as string, status: 'ACCEPTED' })}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">Chap nhan</button>
                      <button onClick={() => updateStatus.mutate({ id: r.id as string, status: 'DECLINED' })}
                        className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">Tu choi</button>
                    </div>
                  )}
                  {r.status === 'ACCEPTED' && (
                    <button onClick={() => updateStatus.mutate({ id: r.id as string, status: 'COMPLETED' })}
                      className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">Hoan thanh</button>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && !referrals.length && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Chua co phieu chuyen vien</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Tao phieu chuyen vien">
        <div className="space-y-4">
          <div>
            <label className="label">Benh nhan</label>
            <select className="input" value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}>
              <option value="">-- Chon benh nhan --</option>
              {patients.map((p: Record<string, string>) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Bac si chuyen</label>
            <select className="input" value={form.fromDoctorId} onChange={e => setForm(f => ({ ...f, fromDoctorId: e.target.value }))}>
              <option value="">-- Chon bac si --</option>
              {doctors.map((d: Record<string, unknown>) => <option key={d.id as string} value={d.id as string}>{(d.user as Record<string, string>)?.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Chuyen den khoa</label>
              <input className="input" placeholder="Khoa noi..." value={form.toDepartment} onChange={e => setForm(f => ({ ...f, toDepartment: e.target.value }))} />
            </div>
            <div>
              <label className="label">Co so y te</label>
              <input className="input" placeholder="Benh vien..." value={form.toFacility} onChange={e => setForm(f => ({ ...f, toFacility: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Ly do chuyen</label>
            <textarea className="input" rows={3} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          </div>
          <div>
            <label className="label">Muc do khan cap</label>
            <select className="input" value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}>
              <option value="ROUTINE">Thuong</option>
              <option value="URGENT">Khan</option>
              <option value="EMERGENCY">Cap cuu</option>
            </select>
          </div>
          <div>
            <label className="label">Ghi chu</label>
            <textarea className="input" rows={2} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Huy</button>
            <button onClick={() => createMut.mutate(form)} disabled={createMut.isLoading} className="btn-primary">
              {createMut.isLoading ? 'Dang luu...' : 'Tao phieu'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
