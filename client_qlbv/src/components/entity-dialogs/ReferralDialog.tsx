import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/lib/axios';
import { DialogFrame } from '@/store/entityDialogStore';
import { ArrowRightLeft, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props { frame: DialogFrame; onClose: () => void; }

const URGENCY: Record<string, string> = { ROUTINE: 'Thuong', URGENT: 'Khan', EMERGENCY: 'Cap cuu' };
const STATUS_CLS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700', ACCEPTED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700', DECLINED: 'bg-red-100 text-red-700',
};

export default function ReferralDialog({ frame, onClose }: Props) {
  const qc = useQueryClient();
  const isCreate = frame.mode === 'create';
  const [editing, setEditing] = useState(isCreate);
  const [form, setForm] = useState({ patientId: (frame.ctx?.patientId as string) || '', toDepartment: '', toFacility: '', reason: '', urgency: 'ROUTINE' });

  const { data, isLoading } = useQuery(
    ['referral-dlg', frame.id],
    () => api.get(`/referrals/${frame.id}`).then(r => r.data.data ?? r.data),
    { enabled: !!frame.id && !isCreate, onSuccess: (d) => setForm({ patientId: d.patientId, toDepartment: d.toDepartment || '', toFacility: d.toFacility || '', reason: d.reason, urgency: d.urgency }) }
  );

  const saveMut = useMutation(
    (d: typeof form) => isCreate ? api.post('/referrals', d) : api.put(`/referrals/${frame.id}`, d),
    { onSuccess: () => { qc.invalidateQueries('referrals'); toast.success(isCreate ? 'Da tao phieu chuyen vien' : 'Da cap nhat'); isCreate ? onClose() : setEditing(false); } }
  );

  const statusMut = useMutation(
    (status: string) => api.put(`/referrals/${frame.id}`, { status }),
    { onSuccess: () => { qc.invalidateQueries(['referral-dlg', frame.id]); qc.invalidateQueries('referrals'); toast.success('Cap nhat trang thai'); } }
  );

  if (isLoading) return <div className="skeleton h-48 rounded-xl" />;

  const ref = isCreate ? null : data;

  return (
    <div>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shrink-0">
          <ArrowRightLeft size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{isCreate ? 'Tao phieu chuyen vien' : 'Phieu chuyen vien'}</h2>
          {ref && <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLS[ref.status] || 'bg-gray-100 text-gray-600'}`}>{ref.status}</span>}
        </div>
        {!isCreate && !editing && (
          <button onClick={() => setEditing(true)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"><Edit2 size={12} /> Sua</button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          {isCreate && (
            <div><label className="label">ID Benh nhan *</label>
              <input className="input" value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} /></div>
          )}
          <div><label className="label">Ly do chuyen vien *</label>
            <textarea className="input" rows={3} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Khoa tiep nhan</label>
              <input className="input" value={form.toDepartment} onChange={e => setForm(f => ({ ...f, toDepartment: e.target.value }))} /></div>
            <div><label className="label">Co so tiep nhan</label>
              <input className="input" value={form.toFacility} onChange={e => setForm(f => ({ ...f, toFacility: e.target.value }))} /></div>
          </div>
          <div><label className="label">Muc do khan cap</label>
            <select className="input" value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}>
              <option value="ROUTINE">Thuong</option>
              <option value="URGENT">Khan</option>
              <option value="EMERGENCY">Cap cuu</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            {!isCreate && <button onClick={() => setEditing(false)} className="btn-secondary flex items-center gap-1"><X size={12} /> Huy</button>}
            <button onClick={() => saveMut.mutate(form)} disabled={saveMut.isLoading} className="btn-primary flex items-center gap-1">
              <Save size={12} /> {saveMut.isLoading ? 'Dang luu...' : 'Luu'}
            </button>
          </div>
        </div>
      ) : ref && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <Row label="Benh nhan" value={ref.patient?.name || ref.patientId} />
            <Row label="Ly do" value={ref.reason} />
            <Row label="Khoa tiep nhan" value={ref.toDepartment || '—'} />
            <Row label="Co so tiep nhan" value={ref.toFacility || '—'} />
            <Row label="Muc do" value={URGENCY[ref.urgency] || ref.urgency} />
            <Row label="Ngay tao" value={new Date(ref.createdAt).toLocaleDateString('vi-VN')} />
          </div>
          {ref.status === 'PENDING' && (
            <div className="flex gap-2">
              <button onClick={() => statusMut.mutate('ACCEPTED')} className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100">Chap nhan</button>
              <button onClick={() => statusMut.mutate('DECLINED')} className="flex-1 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100">Tu choi</button>
            </div>
          )}
          {ref.status === 'ACCEPTED' && (
            <button onClick={() => statusMut.mutate('COMPLETED')} className="w-full py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100">Hoan thanh chuyen vien</button>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 text-xs w-28 shrink-0">{label}:</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
