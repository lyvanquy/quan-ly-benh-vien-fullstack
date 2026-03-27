import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { FlaskConical, AlertTriangle, CheckCircle } from 'lucide-react';
import EntityDialogLink from '@/components/EntityDialogLink';
import { DialogFrame } from '@/store/entityDialogStore';

interface Props { frame: DialogFrame; onClose: () => void; }

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700', IN_PROGRESS: 'bg-teal-100 text-teal-700',
  COMPLETED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700',
};

export default function LabOrderDialog({ frame, onClose }: Props) {
  const qc = useQueryClient();
  const isCreate = frame.mode === 'create';
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const { data: order, isLoading } = useQuery(
    ['lab-dlg', frame.id],
    () => api.get(`/lab/orders/${frame.id}`).then(r => r.data.data),
    { enabled: !!frame.id && !isCreate }
  );

  const { data: testsData } = useQuery('lab-tests', () => api.get('/lab/tests').then(r => r.data.data), { enabled: isCreate });

  const createMut = useMutation(
    () => api.post('/lab/orders', { patientId: frame.ctx?.patientId, testIds: selectedTests, note }),
    { onSuccess: () => { qc.invalidateQueries('lab-orders'); qc.invalidateQueries(['patient-dlg-lab', frame.ctx?.patientId]); onClose(); } }
  );

  if (isCreate) {
    const tests = testsData?.tests || [];
    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600"><FlaskConical size={20} /></div>
          <h2 className="text-lg font-bold text-gray-900">Chi dinh xet nghiem</h2>
        </div>
        <div className="mb-4">
          <label className="label mb-2">Chon xet nghiem</label>
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3">
            {tests.map((t: Record<string, string>) => (
              <label key={t.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                <input type="checkbox" checked={selectedTests.includes(t.id)}
                  onChange={e => setSelectedTests(prev => e.target.checked ? [...prev, t.id] : prev.filter(x => x !== t.id))} />
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.category} — {Number(t.price).toLocaleString('vi-VN')}d</p>
                </div>
              </label>
            ))}
            {!tests.length && <p className="text-center text-gray-400 text-sm py-4">Chua co xet nghiem</p>}
          </div>
        </div>
        <div className="mb-4"><label className="label">Ghi chu</label><textarea className="input" rows={2} value={note} onChange={e => setNote(e.target.value)} /></div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">Huy</button>
          <button onClick={() => createMut.mutate()} disabled={createMut.isLoading || !selectedTests.length} className="btn-primary">
            {createMut.isLoading ? 'Dang luu...' : `Chi dinh (${selectedTests.length})`}
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="flex items-center justify-center h-48 text-gray-400">Dang tai...</div>;
  if (!order) return <div className="text-center py-12 text-gray-400">Khong tim thay phieu XN</div>;

  return (
    <div>
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0"><FlaskConical size={22} /></div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900">Phieu xet nghiem</h2>
          <p className="text-xs text-gray-400">{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>{order.status}</span>
        </div>
      </div>
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-1">Benh nhan</p>
        <EntityDialogLink entity="patient" id={order.patient?.id}>
          <p className="text-sm font-medium text-primary">{order.patient?.name}</p>
        </EntityDialogLink>
      </div>
      <div className="space-y-2">
        {order.items?.map((item: Record<string, unknown>) => (
          <div key={item.id as string} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium">{(item.test as Record<string, string>)?.name}</p>
              <p className="text-xs text-gray-400">{(item.test as Record<string, string>)?.category}</p>
            </div>
            <div className="text-right">
              {item.result ? (
                <div className="flex items-center gap-1.5">
                  {item.isAbnormal && <AlertTriangle size={14} className="text-red-500" />}
                  {!item.isAbnormal && <CheckCircle size={14} className="text-green-500" />}
                  <span className={`text-sm font-semibold ${item.isAbnormal ? 'text-red-600' : 'text-green-600'}`}>
                    {item.result as string} {item.unit as string}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-400">Cho ket qua</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
