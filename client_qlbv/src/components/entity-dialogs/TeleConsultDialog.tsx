import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/lib/axios';
import { DialogFrame } from '@/store/entityDialogStore';
import { Video, Edit2, Save, X, Play, Square, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props { frame: DialogFrame; onClose: () => void; }

const STATUS_CLS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700', IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-600', CANCELLED: 'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<string, string> = { SCHEDULED: 'Da len lich', IN_PROGRESS: 'Dang dien ra', COMPLETED: 'Hoan thanh', CANCELLED: 'Da huy' };

export default function TeleConsultDialog({ frame, onClose }: Props) {
  const qc = useQueryClient();
  const isCreate = frame.mode === 'create';
  const [editing, setEditing] = useState(isCreate);
  const [form, setForm] = useState({
    patientId: (frame.ctx?.patientId as string) || '',
    doctorId: (frame.ctx?.doctorId as string) || '',
    scheduledAt: '',
    note: '',
  });

  const { data, isLoading } = useQuery(
    ['teleconsult-dlg', frame.id],
    () => api.get(`/telemedicine/${frame.id}`).then(r => r.data.data ?? r.data),
    { enabled: !!frame.id && !isCreate }
  );

  const saveMut = useMutation(
    (d: typeof form) => isCreate ? api.post('/telemedicine', d) : api.put(`/telemedicine/${frame.id}`, d),
    { onSuccess: () => { qc.invalidateQueries('teleconsults'); toast.success(isCreate ? 'Da tao lich kham tu xa' : 'Da cap nhat'); isCreate ? onClose() : setEditing(false); } }
  );

  const startMut = useMutation(
    () => api.post(`/telemedicine/${frame.id}/start`),
    { onSuccess: () => { qc.invalidateQueries(['teleconsult-dlg', frame.id]); toast.success('Bat dau phien kham'); } }
  );

  const endMut = useMutation(
    () => api.post(`/telemedicine/${frame.id}/end`),
    { onSuccess: () => { qc.invalidateQueries(['teleconsult-dlg', frame.id]); toast.success('Ket thuc phien kham'); } }
  );

  if (isLoading) return <div className="skeleton h-48 rounded-xl" />;
  const consult = isCreate ? null : data;

  return (
    <div>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shrink-0">
          <Video size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{isCreate ? 'Dat lich kham tu xa' : 'Kham tu xa'}</h2>
          {consult && <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLS[consult.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABEL[consult.status] || consult.status}</span>}
        </div>
        {!isCreate && !editing && consult?.status === 'SCHEDULED' && (
          <button onClick={() => setEditing(true)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"><Edit2 size={12} /> Sua</button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          {isCreate && (
            <>
              <div><label className="label">ID Benh nhan *</label>
                <input className="input" value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} /></div>
              <div><label className="label">ID Bac si *</label>
                <input className="input" value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))} /></div>
            </>
          )}
          <div><label className="label">Thoi gian hen *</label>
            <input type="datetime-local" className="input" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} /></div>
          <div><label className="label">Ghi chu</label>
            <textarea className="input" rows={2} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></div>
          <div className="flex gap-3 justify-end pt-2">
            {!isCreate && <button onClick={() => setEditing(false)} className="btn-secondary flex items-center gap-1"><X size={12} /> Huy</button>}
            <button onClick={() => saveMut.mutate(form)} disabled={saveMut.isLoading} className="btn-primary flex items-center gap-1">
              <Save size={12} /> {saveMut.isLoading ? 'Dang luu...' : 'Luu'}
            </button>
          </div>
        </div>
      ) : consult && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <Row label="Benh nhan" value={consult.patient?.name || consult.patientId} />
            <Row label="Bac si" value={consult.doctor?.user?.name || consult.doctorId} />
            <Row label="Thoi gian" value={new Date(consult.scheduledAt).toLocaleString('vi-VN')} />
            {consult.startedAt && <Row label="Bat dau" value={new Date(consult.startedAt).toLocaleString('vi-VN')} />}
            {consult.endedAt && <Row label="Ket thuc" value={new Date(consult.endedAt).toLocaleString('vi-VN')} />}
            {consult.note && <Row label="Ghi chu" value={consult.note} />}
          </div>

          {consult.roomUrl && (
            <a href={consult.roomUrl} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700">
              <ExternalLink size={15} /> Vao phong kham
            </a>
          )}

          <div className="flex gap-2">
            {consult.status === 'SCHEDULED' && (
              <button onClick={() => startMut.mutate()} disabled={startMut.isLoading} className="flex-1 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 flex items-center justify-center gap-1.5">
                <Play size={13} /> Bat dau
              </button>
            )}
            {consult.status === 'IN_PROGRESS' && (
              <button onClick={() => endMut.mutate()} disabled={endMut.isLoading} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center justify-center gap-1.5">
                <Square size={13} /> Ket thuc
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 text-xs w-24 shrink-0">{label}:</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
