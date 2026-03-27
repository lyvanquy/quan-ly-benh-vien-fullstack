import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import { Plus, ShieldCheck, FileText } from 'lucide-react';
import EntityDialogLink from '@/components/EntityDialogLink';

const CLAIM_STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600', SUBMITTED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-700',
  PAID: 'bg-purple-100 text-purple-700',
};
const CLAIM_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nhap', SUBMITTED: 'Da nop', APPROVED: 'Duoc duyet',
  REJECTED: 'Tu choi', PAID: 'Da thanh toan',
};

export default function InsurancePage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'policies' | 'claims'>('policies');
  const [openPolicy, setOpenPolicy] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    patientId: '', provider: '', policyNo: '', planName: '',
    validFrom: '', validTo: '', coveragePercent: 80,
  });

  const { data: policies = [] } = useQuery('insurance-policies', () =>
    api.get('/insurance/policies').then(r => r.data.data));
  const { data: claims = [] } = useQuery('insurance-claims', () =>
    api.get('/insurance/claims').then(r => r.data.data));
  const { data: patients = [] } = useQuery('insurance-patients', () =>
    api.get('/patients?limit=200').then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.patients ?? []); }));

  const createPolicy = useMutation(
    (d: typeof policyForm) => api.post('/insurance/policies', { ...d, coveragePercent: Number(d.coveragePercent) }),
    { onSuccess: () => { qc.invalidateQueries('insurance-policies'); setOpenPolicy(false); } }
  );

  const updateClaim = useMutation(
    ({ id, status }: { id: string; status: string }) => api.patch(`/insurance/claims/${id}/status`, { status }),
    { onSuccess: () => qc.invalidateQueries('insurance-claims') }
  );

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bao hiem y te</h1>
          <p className="text-gray-500 text-sm mt-1">Quan ly hop dong va yeu cau boi thuong</p>
        </div>
        {tab === 'policies' && (
          <button onClick={() => setOpenPolicy(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Them hop dong
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {(['policies', 'claims'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'policies' ? 'Hop dong BH' : 'Yeu cau boi thuong'}
          </button>
        ))}
      </div>

      {tab === 'policies' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Benh nhan', 'Nha cung cap', 'So hop dong', 'Goi bao hiem', 'Hieu luc', 'Het han', 'Muc bao hiem'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(policies as Record<string, unknown>[]).map((p) => (
                <tr key={p.id as string} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <EntityDialogLink entity="patient" id={(p.patient as Record<string, string>)?.id}>{(p.patient as Record<string, string>)?.name}</EntityDialogLink>
                  </td>
                  <td className="px-4 py-3">{p.provider as string}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.policyNo as string}</td>
                  <td className="px-4 py-3 text-gray-600">{p.planName as string || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.validFrom as string).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.validTo as string).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">{p.coveragePercent as number}%</span>
                  </td>
                </tr>
              ))}
              {(policies as unknown[]).length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  <ShieldCheck size={32} className="mx-auto mb-2 opacity-30" />Chua co hop dong bao hiem
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'claims' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Benh nhan', 'Nha cung cap', 'So hop dong', 'So tien yeu cau', 'Trang thai', 'Ngay tao', 'Hanh dong'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(claims as Record<string, unknown>[]).map((c) => (
                <tr key={c.id as string} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <EntityDialogLink entity="patient" id={(c.bill as Record<string, Record<string, string>>)?.patient?.id}>{(c.bill as Record<string, Record<string, string>>)?.patient?.name}</EntityDialogLink>
                  </td>
                  <td className="px-4 py-3">{c.provider as string}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.policyNo as string}</td>
                  <td className="px-4 py-3 font-medium">{(c.claimAmount as number).toLocaleString('vi-VN')}d</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${CLAIM_STATUS_COLOR[c.status as string]}`}>
                      {CLAIM_STATUS_LABEL[c.status as string]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt as string).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    {c.status === 'DRAFT' && (
                      <button onClick={() => updateClaim.mutate({ id: c.id as string, status: 'SUBMITTED' })}
                        className="text-xs text-blue-600 hover:underline">Nop yeu cau</button>
                    )}
                    {c.status === 'SUBMITTED' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateClaim.mutate({ id: c.id as string, status: 'APPROVED' })}
                          className="text-xs text-green-600 hover:underline">Duyet</button>
                        <button onClick={() => updateClaim.mutate({ id: c.id as string, status: 'REJECTED' })}
                          className="text-xs text-red-600 hover:underline">Tu choi</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {(claims as unknown[]).length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  <FileText size={32} className="mx-auto mb-2 opacity-30" />Chua co yeu cau boi thuong
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={openPolicy} onClose={() => setOpenPolicy(false)} title="Them hop dong bao hiem">
        <div className="space-y-4">
          <div>
            <label className="label">Benh nhan</label>
            <select className="input" value={policyForm.patientId} onChange={e => setPolicyForm(f => ({ ...f, patientId: e.target.value }))}>
              <option value="">-- Chon benh nhan --</option>
              {(patients as Record<string, string>[]).map(p => <option key={p.id} value={p.id}>{p.name} - {p.phone}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nha cung cap BH</label>
              <input className="input" placeholder="BHYT / Bao Viet..." value={policyForm.provider} onChange={e => setPolicyForm(f => ({ ...f, provider: e.target.value }))} />
            </div>
            <div>
              <label className="label">So hop dong</label>
              <input className="input" value={policyForm.policyNo} onChange={e => setPolicyForm(f => ({ ...f, policyNo: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Goi bao hiem</label>
              <input className="input" value={policyForm.planName} onChange={e => setPolicyForm(f => ({ ...f, planName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Muc bao hiem (%)</label>
              <input type="number" min={0} max={100} className="input" value={policyForm.coveragePercent}
                onChange={e => setPolicyForm(f => ({ ...f, coveragePercent: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ngay hieu luc</label>
              <input type="date" className="input" value={policyForm.validFrom} onChange={e => setPolicyForm(f => ({ ...f, validFrom: e.target.value }))} />
            </div>
            <div>
              <label className="label">Ngay het han</label>
              <input type="date" className="input" value={policyForm.validTo} onChange={e => setPolicyForm(f => ({ ...f, validTo: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button className="btn-secondary" onClick={() => setOpenPolicy(false)}>Huy</button>
            <button className="btn-primary" onClick={() => createPolicy.mutate(policyForm)} disabled={createPolicy.isLoading}>
              {createPolicy.isLoading ? 'Dang luu...' : 'Luu'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
