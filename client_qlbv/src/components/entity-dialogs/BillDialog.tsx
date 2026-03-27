import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { Receipt, Plus, Trash2 } from 'lucide-react';
import EntityDialogLink from '@/components/EntityDialogLink';
import { DialogFrame } from '@/store/entityDialogStore';
import StatusBadge from '@/components/StatusBadge';

interface Props { frame: DialogFrame; onClose: () => void; }

const STATUS_COLOR: Record<string, string> = {
  UNPAID: 'bg-red-100 text-red-700', PAID: 'bg-green-100 text-green-700', PARTIAL: 'bg-yellow-100 text-yellow-700',
};

export default function BillDialog({ frame, onClose }: Props) {
  const qc = useQueryClient();
  const isCreate = frame.mode === 'create';
  const [items, setItems] = useState([{ serviceName: '', serviceType: 'SERVICE', price: 0, quantity: 1, total: 0 }]);
  const [note, setNote] = useState('');

  const { data: bill, isLoading } = useQuery(
    ['bill-dlg', frame.id],
    () => api.get(`/bills/${frame.id}`).then(r => r.data.data),
    { enabled: !!frame.id && !isCreate }
  );

  const createMut = useMutation(
    () => {
      const totalAmount = items.reduce((s, i) => s + i.total, 0);
      return api.post('/bills', { patientId: frame.ctx?.patientId, totalAmount, finalAmount: totalAmount, note, items });
    },
    { onSuccess: () => { qc.invalidateQueries('bills'); qc.invalidateQueries(['patient-dlg-bills', frame.ctx?.patientId]); onClose(); } }
  );

  const payMut = useMutation(
    (method: string) => api.put(`/bills/${frame.id}`, { paymentStatus: 'PAID', paymentMethod: method, paidAt: new Date() }),
    { onSuccess: () => { qc.invalidateQueries(['bill-dlg', frame.id]); qc.invalidateQueries('bills'); } }
  );

  const updateItem = (i: number, field: string, val: string | number) => {
    setItems(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      if (field === 'price' || field === 'quantity') next[i].total = next[i].price * next[i].quantity;
      return next;
    });
  };

  if (isCreate) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600"><Receipt size={20} /></div>
          <h2 className="text-lg font-bold text-gray-900">Tao hoa don moi</h2>
        </div>
        <div className="space-y-3 mb-4">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input className="input col-span-4 text-sm" placeholder="Ten dich vu" value={item.serviceName} onChange={e => updateItem(i, 'serviceName', e.target.value)} />
              <select className="input col-span-3 text-sm" value={item.serviceType} onChange={e => updateItem(i, 'serviceType', e.target.value)}>
                <option value="SERVICE">Dich vu</option>
                <option value="MEDICINE">Thuoc</option>
                <option value="LAB">Xet nghiem</option>
              </select>
              <input type="number" className="input col-span-2 text-sm" placeholder="Don gia" value={item.price} onChange={e => updateItem(i, 'price', Number(e.target.value))} />
              <input type="number" className="input col-span-2 text-sm" placeholder="SL" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} />
              <button onClick={() => setItems(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 col-span-1 flex justify-center">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button onClick={() => setItems(prev => [...prev, { serviceName: '', serviceType: 'SERVICE', price: 0, quantity: 1, total: 0 }])}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Plus size={12} /> Them dong
          </button>
        </div>
        <div className="mb-4">
          <label className="label">Ghi chu</label>
          <textarea className="input" rows={2} value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-4">
          <span className="text-sm text-gray-600">Tong cong:</span>
          <span className="text-lg font-bold text-primary">{items.reduce((s, i) => s + i.total, 0).toLocaleString('vi-VN')}d</span>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">Huy</button>
          <button onClick={() => createMut.mutate()} disabled={createMut.isLoading} className="btn-primary">{createMut.isLoading ? 'Dang luu...' : 'Tao hoa don'}</button>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="flex items-center justify-center h-48 text-gray-400">Dang tai...</div>;
  if (!bill) return <div className="text-center py-12 text-gray-400">Khong tim thay hoa don</div>;

  return (
    <div>
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600 shrink-0"><Receipt size={22} /></div>
        <div className="flex-1">
          <p className="text-xs font-mono text-gray-400 mb-0.5">#{bill.billCode?.slice(-8)}</p>
          <h2 className="text-xl font-bold text-primary">{bill.finalAmount?.toLocaleString('vi-VN')}d</h2>
          <div className="mt-1"><StatusBadge status={bill.paymentStatus} size="md" /></div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-1">Benh nhan</p>
        <EntityDialogLink entity="patient" id={bill.patient?.id}>
          <p className="text-sm font-medium text-primary">{bill.patient?.name}</p>
        </EntityDialogLink>
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{['Dich vu', 'Loai', 'Don gia', 'SL', 'Thanh tien'].map(h => (
              <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bill.items?.map((item: Record<string, unknown>) => (
              <tr key={item.id as string}>
                <td className="px-3 py-2">{item.serviceName as string}</td>
                <td className="px-3 py-2 text-gray-500">{item.serviceType as string}</td>
                <td className="px-3 py-2">{(item.price as number).toLocaleString('vi-VN')}d</td>
                <td className="px-3 py-2">{item.quantity as number}</td>
                <td className="px-3 py-2 font-medium">{(item.total as number).toLocaleString('vi-VN')}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-4 text-sm">
        <span className="text-gray-500">Ngay tao: {format(new Date(bill.createdAt), 'dd/MM/yyyy')}</span>
        {bill.paidAt && <span className="text-green-600">Da thanh toan: {format(new Date(bill.paidAt), 'dd/MM/yyyy')}</span>}
      </div>

      {bill.paymentStatus === 'UNPAID' && (
        <div className="flex gap-2">
          {['CASH', 'CARD', 'TRANSFER'].map(method => (
            <button key={method} onClick={() => payMut.mutate(method)}
              className="flex-1 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100">
              {method === 'CASH' ? 'Tien mat' : method === 'CARD' ? 'The' : 'Chuyen khoan'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
