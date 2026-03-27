import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import EntityDialogLink from '@/components/EntityDialogLink';
import StatusBadge from '@/components/StatusBadge';

interface Bill {
  id: string; totalAmount: number; paymentStatus: string; createdAt: string;
  patient: { name: string };
}

interface BillForm {
  patientId: string;
  items: { serviceName: string; price: number; quantity: number }[];
}

export default function BillingPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, control, watch } = useForm<BillForm>({
    defaultValues: { items: [{ serviceName: '', price: 0, quantity: 1 }] }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');
  const total = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);

  const { data, isLoading } = useQuery('bills', () => api.get('/bills').then(r => r.data.data));
  const { data: patientsData } = useQuery('billing-patients', () =>
    api.get('/patients', { params: { limit: 100 } }).then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.patients ?? []); }));

  const createMutation = useMutation(
    (d: BillForm) => api.post('/bills', d),
    { onSuccess: () => { qc.invalidateQueries('bills'); toast.success('Tạo hóa đơn thành công'); setShowModal(false); reset(); } }
  );

  const payMutation = useMutation(
    (id: string) => api.patch(`/bills/${id}/status`, { paymentStatus: 'PAID' }),
    { onSuccess: () => { qc.invalidateQueries('bills'); toast.success('Đã thanh toán'); } }
  );

  const columns = [
    { key: 'patient', label: 'Bệnh nhân', render: (r: Bill) => <EntityDialogLink entity="patient" id={(r.patient as unknown as { id: string })?.id}>{r.patient?.name}</EntityDialogLink> },
    { key: 'totalAmount', label: 'Tổng tiền', render: (r: Bill) => `${r.totalAmount.toLocaleString('vi-VN')}đ` },
    { key: 'paymentStatus', label: 'Trạng thái', render: (r: Bill) => <StatusBadge status={r.paymentStatus} /> },
    { key: 'createdAt', label: 'Ngày tạo', render: (r: Bill) => format(new Date(r.createdAt), 'dd/MM/yyyy') },
    {
      key: 'actions', label: '', render: (r: Bill) => r.paymentStatus === 'UNPAID' ? (
        <button onClick={() => payMutation.mutate(r.id)} className="text-xs btn-primary py-1 px-2">Thanh toán</button>
      ) : null
    },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thanh toán</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý hóa đơn và thanh toán</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} />Tạo hóa đơn</button>
      </div>

      <div className="card">
        <Table columns={columns as never} data={data?.bills ?? []} loading={isLoading} />
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); reset(); }} title="Tạo hóa đơn" size="lg">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Bệnh nhân *</label>
            <select className="input" {...register('patientId', { required: true })}>
              <option value="">-- Chọn bệnh nhân --</option>
              {(patientsData as {id:string;name:string}[] ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Dịch vụ *</label>
              <button type="button" onClick={() => append({ serviceName: '', price: 0, quantity: 1 })} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus size={12} />Thêm dòng</button>
            </div>
            <div className="space-y-2">
              {fields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                  <input className="input col-span-5" placeholder="Tên dịch vụ" {...register(`items.${i}.serviceName`, { required: true })} />
                  <input type="number" className="input col-span-3" placeholder="Giá" {...register(`items.${i}.price`, { required: true })} />
                  <input type="number" className="input col-span-2" placeholder="SL" min={1} {...register(`items.${i}.quantity`, { required: true })} />
                  <button type="button" onClick={() => remove(i)} className="col-span-2 text-red-400 hover:text-red-600 flex justify-center"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-right">
            <span className="text-sm text-gray-500">Tổng cộng: </span>
            <span className="font-bold text-lg text-primary">{total.toLocaleString('vi-VN')}đ</span>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => { setShowModal(false); reset(); }} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={createMutation.isLoading} className="btn-primary">{createMutation.isLoading ? 'Đang lưu...' : 'Tạo hóa đơn'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
