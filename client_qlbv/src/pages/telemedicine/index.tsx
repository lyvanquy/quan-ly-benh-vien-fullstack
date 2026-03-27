import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { Plus, Video, Play, Square } from 'lucide-react';
import EntityDialogLink from '@/components/EntityDialogLink';

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function TelemedicinePage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ patientId: '', doctorId: '', scheduledAt: '', note: '' });

  const { data, isLoading } = useQuery('teleconsults', () => api.get('/telemedicine').then(r => r.data.data));
  const { data: patientsData } = useQuery('tele-patients', () =>
    api.get('/patients?limit=200').then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.patients ?? []); }));
  const { data: doctorsData } = useQuery('tele-doctors', () =>
    api.get('/doctors?limit=200').then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.doctors ?? []); }));

  const createMut = useMutation((d: typeof form) => api.post('/telemedicine', d), {
    onSuccess: () => { qc.invalidateQueries('teleconsults'); setShowModal(false); },
  });

  const startMut = useMutation((id: string) => api.post(`/telemedicine/${id}/start`), {
    onSuccess: () => qc.invalidateQueries('teleconsults'),
  });

  const endMut = useMutation((id: string) => api.post(`/telemedicine/${id}/end`), {
    onSuccess: () => qc.invalidateQueries('teleconsults'),
  });

  const consults = data?.consults || [];
  const patients = Array.isArray(patientsData) ? patientsData : [];
  const doctors = Array.isArray(doctorsData) ? doctorsData : [];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Video className="text-primary" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">Kham tu xa (Telemedicine)</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Dat lich kham tu xa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 text-center py-12 text-gray-400">Dang tai...</div>
        ) : consults.map((c: Record<string, unknown>) => (
          <div key={c.id as string} className="card">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold">
                  <EntityDialogLink entity="patient" id={(c.patient as Record<string, string>)?.id}>{(c.patient as Record<string, string>)?.name}</EntityDialogLink>
                </p>
                <p className="text-sm text-gray-500">BS. <EntityDialogLink entity="doctor" id={(c.doctor as Record<string, string>)?.id}>{((c.doctor as Record<string, unknown>)?.user as Record<string, string>)?.name}</EntityDialogLink></p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[c.status as string] || 'bg-gray-100 text-gray-600'}`}>{c.status as string}</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {format(new Date(c.scheduledAt as string), 'dd/MM/yyyy HH:mm')}
            </p>
            {!!c.note && <p className="text-xs text-gray-500 mb-3 italic">{String(c.note)}</p>}
            <div className="flex gap-2">
              {c.status === 'SCHEDULED' && (
                <button onClick={() => startMut.mutate(c.id as string)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                  <Play size={12} /> Bat dau
                </button>
              )}
              {c.status === 'IN_PROGRESS' && (
                <>
                  {c.roomUrl && (
                    <a href={c.roomUrl as string} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                      <Video size={12} /> Vao phong
                    </a>
                  )}
                  <button onClick={() => endMut.mutate(c.id as string)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100">
                    <Square size={12} /> Ket thuc
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {!isLoading && !consults.length && (
          <div className="col-span-3 text-center py-12 text-gray-400">Chua co lich kham tu xa</div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Dat lich kham tu xa">
        <div className="space-y-4">
          <div>
            <label className="label">Benh nhan</label>
            <select className="input" value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}>
              <option value="">-- Chon benh nhan --</option>
              {patients.map((p: Record<string, string>) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Bac si</label>
            <select className="input" value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}>
              <option value="">-- Chon bac si --</option>
              {doctors.map((d: Record<string, unknown>) => <option key={d.id as string} value={d.id as string}>{(d.user as Record<string, string>)?.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Thoi gian</label>
            <input type="datetime-local" className="input" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
          </div>
          <div>
            <label className="label">Ghi chu</label>
            <textarea className="input" rows={2} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Huy</button>
            <button onClick={() => createMut.mutate(form)} disabled={createMut.isLoading} className="btn-primary">
              {createMut.isLoading ? 'Dang luu...' : 'Dat lich'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
