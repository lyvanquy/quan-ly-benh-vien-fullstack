import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { Plus, FileCheck, CheckCircle } from 'lucide-react';
import EntityDialogLink from '@/components/EntityDialogLink';

const TYPE_LABELS: Record<string, string> = {
  GENERAL: 'Tong quat', SURGERY: 'Phau thuat', ANESTHESIA: 'Gay me', RESEARCH: 'Nghien cuu',
};

export default function ConsentPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [signModal, setSignModal] = useState<string | null>(null);
  const [form, setForm] = useState({ patientId: '', type: 'GENERAL', content: '' });
  const [signForm, setSignForm] = useState({ signedBy: '', witnessId: '' });

  const { data, isLoading } = useQuery('consent-forms', () => api.get('/consent').then(r => r.data.data));
  const { data: patientsData } = useQuery('consent-patients', () =>
    api.get('/patients?limit=200').then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.patients ?? []); }));

  const createMut = useMutation((d: typeof form) => api.post('/consent', d), {
    onSuccess: () => { qc.invalidateQueries('consent-forms'); setShowModal(false); },
  });

  const signMut = useMutation(({ id, data }: { id: string; data: typeof signForm }) =>
    api.put(`/consent/${id}/sign`, data), {
    onSuccess: () => { qc.invalidateQueries('consent-forms'); setSignModal(null); },
  });

  const forms = data?.forms || [];
  const patients = Array.isArray(patientsData) ? patientsData : [];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileCheck className="text-primary" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">Phieu dong thuan</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tao phieu
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>{['Benh nhan', 'Loai', 'Noi dung', 'Nguoi ky', 'Ngay ky', 'Trang thai', 'Hanh dong'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Dang tai...</td></tr>
            ) : forms.map((f: Record<string, unknown>) => (
              <tr key={f.id as string} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <EntityDialogLink entity="patient" id={(f.patient as Record<string, string>)?.id}>{(f.patient as Record<string, string>)?.name}</EntityDialogLink>
                </td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{TYPE_LABELS[f.type as string] || f.type as string}</span></td>
                <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{f.content as string}</td>
                <td className="px-4 py-3 text-gray-600">{(f.signedBy as string) || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{f.signedAt ? format(new Date(f.signedAt as string), 'dd/MM/yyyy') : '-'}</td>
                <td className="px-4 py-3">
                  {f.signedAt
                    ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={12} /> Da ky</span>
                    : <span className="text-yellow-600 text-xs">Chua ky</span>}
                </td>
                <td className="px-4 py-3">
                  {!f.signedAt && (
                    <button onClick={() => setSignModal(f.id as string)}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20">
                      Ky duyet
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && !forms.length && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Chua co phieu dong thuan</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Tao phieu dong thuan">
        <div className="space-y-4">
          <div>
            <label className="label">Benh nhan</label>
            <select className="input" value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}>
              <option value="">-- Chon benh nhan --</option>
              {patients.map((p: Record<string, string>) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Loai phieu</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Noi dung dong thuan</label>
            <textarea className="input" rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Huy</button>
            <button onClick={() => createMut.mutate(form)} disabled={createMut.isLoading} className="btn-primary">
              {createMut.isLoading ? 'Dang luu...' : 'Tao phieu'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!signModal} onClose={() => setSignModal(null)} title="Ky duyet phieu dong thuan">
        <div className="space-y-4">
          <div>
            <label className="label">Nguoi ky (ten benh nhan / nguoi giam ho)</label>
            <input className="input" value={signForm.signedBy} onChange={e => setSignForm(f => ({ ...f, signedBy: e.target.value }))} />
          </div>
          <div>
            <label className="label">Nhan chung (ID nhan vien)</label>
            <input className="input" value={signForm.witnessId} onChange={e => setSignForm(f => ({ ...f, witnessId: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setSignModal(null)} className="btn-secondary">Huy</button>
            <button onClick={() => signModal && signMut.mutate({ id: signModal, data: signForm })}
              disabled={signMut.isLoading} className="btn-primary">
              {signMut.isLoading ? 'Dang luu...' : 'Xac nhan ky'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
