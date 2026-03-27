import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/lib/axios';
import { DialogFrame } from '@/store/entityDialogStore';
import { FileCheck, Edit2, Save, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props { frame: DialogFrame; onClose: () => void; }

const TYPE_LABEL: Record<string, string> = { GENERAL: 'Tong quat', SURGERY: 'Phau thuat', ANESTHESIA: 'Gay me', RESEARCH: 'Nghien cuu' };

export default function ConsentDialog({ frame, onClose }: Props) {
  const qc = useQueryClient();
  const isCreate = frame.mode === 'create';
  const [editing, setEditing] = useState(isCreate);
  const [form, setForm] = useState({ patientId: (frame.ctx?.patientId as string) || '', type: 'GENERAL', content: '' });

  const { data, isLoading } = useQuery(
    ['consent-dlg', frame.id],
    () => api.get(`/consent/${frame.id}`).then(r => r.data.data ?? r.data),
    { enabled: !!frame.id && !isCreate, onSuccess: (d) => setForm({ patientId: d.patientId, type: d.type, content: d.content }) }
  );

  const saveMut = useMutation(
    (d: typeof form) => isCreate ? api.post('/consent', d) : api.put(`/consent/${frame.id}`, d),
    { onSuccess: () => { qc.invalidateQueries('consent'); toast.success(isCreate ? 'Da tao phieu dong thuan' : 'Da cap nhat'); isCreate ? onClose() : setEditing(false); } }
  );

  const signMut = useMutation(
    () => api.put(`/consent/${frame.id}/sign`, { signedBy: 'Benh nhan' }),
    { onSuccess: () => { qc.invalidateQueries(['consent-dlg', frame.id]); toast.success('Da ky phieu dong thuan'); } }
  );

  if (isLoading) return <div className="skeleton h-48 rounded-xl" />;
  const consent = isCreate ? null : data;

  return (
    <div>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center shrink-0">
          <FileCheck size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{isCreate ? 'Tao phieu dong thuan' : `Phieu dong thuan — ${TYPE_LABEL[consent?.type] || consent?.type}`}</h2>
          {consent?.signedAt && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-green-600">
              <CheckCircle size={12} /> Da ky ngay {new Date(consent.signedAt).toLocaleDateString('vi-VN')}
            </div>
          )}
        </div>
        {!isCreate && !editing && !consent?.signedAt && (
          <button onClick={() => setEditing(true)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"><Edit2 size={12} /> Sua</button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          {isCreate && (
            <div><label className="label">ID Benh nhan *</label>
              <input className="input" value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} /></div>
          )}
          <div><label className="label">Loai phieu *</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="GENERAL">Tong quat</option>
              <option value="SURGERY">Phau thuat</option>
              <option value="ANESTHESIA">Gay me</option>
              <option value="RESEARCH">Nghien cuu</option>
            </select>
          </div>
          <div><label className="label">Noi dung dong thuan *</label>
            <textarea className="input" rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} /></div>
          <div className="flex gap-3 justify-end pt-2">
            {!isCreate && <button onClick={() => setEditing(false)} className="btn-secondary flex items-center gap-1"><X size={12} /> Huy</button>}
            <button onClick={() => saveMut.mutate(form)} disabled={saveMut.isLoading} className="btn-primary flex items-center gap-1">
              <Save size={12} /> {saveMut.isLoading ? 'Dang luu...' : 'Luu'}
            </button>
          </div>
        </div>
      ) : consent && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <Row label="Benh nhan" value={consent.patient?.name || consent.patientId} />
            <Row label="Loai" value={TYPE_LABEL[consent.type] || consent.type} />
            <Row label="Ngay tao" value={new Date(consent.createdAt).toLocaleDateString('vi-VN')} />
            {consent.signedAt && <Row label="Ngay ky" value={new Date(consent.signedAt).toLocaleDateString('vi-VN')} />}
            {consent.signedBy && <Row label="Nguoi ky" value={consent.signedBy} />}
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-600 mb-2">Noi dung</p>
            <p className="text-sm text-gray-700 leading-relaxed">{consent.content}</p>
          </div>
          {!consent.signedAt && (
            <button onClick={() => signMut.mutate()} disabled={signMut.isLoading} className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-2">
              <CheckCircle size={16} /> {signMut.isLoading ? 'Dang xu ly...' : 'Xac nhan ky phieu'}
            </button>
          )}
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
