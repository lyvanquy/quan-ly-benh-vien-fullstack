import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import StatusBadge from '@/components/StatusBadge';
import EntityDialogLink from '@/components/EntityDialogLink';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Plus, Trash2, Receipt, DollarSign, Clock, CheckCircle,
  Search, X, Printer, CreditCard
} from 'lucide-react';
import { format } from 'date-fns';

interface Bill {
  id: string; billCode: string; totalAmount: number; finalAmount: number;
  discount: number; insuranceCover: number;
  paymentStatus: string; paymentMethod?: string;
  createdAt: string; paidAt?: string;
  patient: { id: string; name: string; phone?: string };
  items: { serviceName: string; price: number; quantity: number; total: number }[];
}

interface BillForm {
  patientId: string;
  discount: number;
  note: string;
  items: { serviceName: string; serviceType: string; price: number; quantity: number }[];
}

interface PayForm {
  paymentMethod: string;
  note: string;
}

const SERVICE_TYPES = [
  { value: 'SERVICE',  label: 'Dịch vụ khám' },
  { value: 'MEDICINE', label: 'Thuốc' },
  { value: 'LAB',      label: 'Xét nghiệm' },
  { value: 'SURGERY',  label: 'Phẫu thuật' },
  { value: 'ROOM',     label: 'Phòng bệnh' },
];

const PAYMENT_METHODS = [
  { value: 'CASH',     label: '💵 Tiền mặt' },
  { value: 'TRANSFER', label: '🏦 Chuyển khoản' },
  { value: 'CARD',     label: '💳 Thẻ tín dụng / Ghi nợ' },
  { value: 'INSURANCE',label: '🏥 Bảo hiểm y tế' },
  { value: 'MOMO',     label: '💜 MoMo' },
];

const STATUS_OPTIONS = [
  { value: '',        label: 'Tất cả trạng thái' },
  { value: 'UNPAID',  label: 'Chưa thanh toán' },
  { value: 'PAID',    label: 'Đã thanh toán' },
  { value: 'PARTIAL', label: 'Thanh toán một phần' },
  { value: 'REFUNDED',label: 'Đã hoàn tiền' },
];

function BillStatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-4 ${color}`}>
      <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none truncate">{value}</p>
        <p className="text-xs mt-0.5 opacity-80">{label}</p>
        {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function BillingPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [payTarget, setPayTarget] = useState<Bill | null>(null);
  const [viewTarget, setViewTarget] = useState<Bill | null>(null);
  const [statusFilter, setStatus] = useState('');
  const [search, setSearch] = useState('');

  // Create bill form
  const { register, handleSubmit, reset, control, watch } = useForm<BillForm>({
    defaultValues: {
      patientId: '', discount: 0, note: '',
      items: [{ serviceName: '', serviceType: 'SERVICE', price: 0, quantity: 1 }]
    }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems   = watch('items');
  const watchDiscount = watch('discount');
  const subtotal = watchItems.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
  const discountAmt  = subtotal * ((Number(watchDiscount) || 0) / 100);
  const totalDue     = subtotal - discountAmt;

  // Payment form
  const payForm = useForm<PayForm>({ defaultValues: { paymentMethod: 'CASH', note: '' } });

  const { data, isLoading } = useQuery(
    ['bills', statusFilter],
    () => api.get('/bills', { params: { status: statusFilter || undefined } }).then(r => r.data.data)
  );

  const { data: patientsData } = useQuery('billing-patients', () =>
    api.get('/patients', { params: { limit: 200 } }).then(r => {
      const d = r.data.data;
      return Array.isArray(d) ? d : (d?.patients ?? []);
    }));

  const bills: Bill[] = data?.bills ?? [];

  // Stats
  const unpaidBills = bills.filter(b => b.paymentStatus === 'UNPAID');
  const paidBills   = bills.filter(b => b.paymentStatus === 'PAID');
  const todayRevenue = paidBills
    .filter(b => b.paidAt && new Date(b.paidAt).toDateString() === new Date().toDateString())
    .reduce((s, b) => s + b.finalAmount, 0);

  // Filtered by search
  const filteredBills = search
    ? bills.filter(b =>
        b.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.billCode?.toLowerCase().includes(search.toLowerCase())
      )
    : bills;

  // Mutations
  const createMutation = useMutation(
    (d: BillForm) => api.post('/bills', d),
    {
      onSuccess: () => {
        qc.invalidateQueries('bills');
        toast.success('Tạo hóa đơn thành công');
        setShowModal(false);
        reset();
      },
      onError: () => { toast.error('Tạo hóa đơn thất bại'); },
    }
  );

  const payMutation = useMutation(
    ({ id, data }: { id: string; data: PayForm }) =>
      api.patch(`/bills/${id}/status`, { paymentStatus: 'PAID', paymentMethod: data.paymentMethod, note: data.note }),
    {
      onSuccess: () => {
        qc.invalidateQueries('bills');
        toast.success('Thanh toán thành công!');
        setPayTarget(null);
        payForm.reset();
      },
      onError: () => { toast.error('Thanh toán thất bại'); },
    }
  );

  const columns = [
    {
      key: 'billCode', label: 'Mã hóa đơn',
      render: (r: Bill) => (
        <button onClick={() => setViewTarget(r)} className="text-xs font-mono text-primary-600 hover:underline">
          {r.billCode?.slice(0, 8).toUpperCase() || '—'}
        </button>
      )
    },
    {
      key: 'patient', label: 'Bệnh nhân',
      render: (r: Bill) => (
        <EntityDialogLink entity="patient" id={r.patient?.id}>
          <span className="font-medium text-sm text-gray-900">{r.patient?.name}</span>
        </EntityDialogLink>
      )
    },
    {
      key: 'items', label: 'Dịch vụ',
      render: (r: Bill) => (
        <div className="flex flex-wrap gap-1">
          {r.items?.slice(0, 2).map((it, i) => (
            <span key={i} className="text-xs bg-gray-50 border border-gray-100 rounded-lg px-2 py-0.5 text-gray-600">
              {it.serviceName}
            </span>
          ))}
          {(r.items?.length ?? 0) > 2 && (
            <span className="text-xs text-gray-400">+{r.items.length - 2}</span>
          )}
        </div>
      )
    },
    {
      key: 'finalAmount', label: 'Tổng tiền',
      render: (r: Bill) => (
        <div>
          <span className="font-bold text-gray-900">{r.finalAmount.toLocaleString('vi-VN')}đ</span>
          {r.discount > 0 && (
            <p className="text-xs text-emerald-600">Giảm {r.discount}%</p>
          )}
        </div>
      )
    },
    { key: 'paymentStatus', label: 'Trạng thái', render: (r: Bill) => <StatusBadge status={r.paymentStatus} /> },
    {
      key: 'createdAt', label: 'Ngày tạo',
      render: (r: Bill) => (
        <div>
          <p className="text-sm">{format(new Date(r.createdAt), 'dd/MM/yyyy')}</p>
          {r.paidAt && <p className="text-xs text-emerald-600">Thanh toán: {format(new Date(r.paidAt), 'dd/MM HH:mm')}</p>}
        </div>
      )
    },
    {
      key: 'actions', label: '',
      render: (r: Bill) => (
        <div className="flex items-center gap-1.5">
          {r.paymentStatus === 'UNPAID' && (
            <button
              onClick={() => setPayTarget(r)}
              className="btn-primary py-1 px-2 text-xs"
            >
              <CreditCard size={12} /> Thanh toán
            </button>
          )}
          <button onClick={() => setViewTarget(r)} className="btn-icon w-7 h-7 text-gray-400 hover:text-gray-600" title="Xem chi tiết">
            <Receipt size={13} />
          </button>
        </div>
      )
    },
  ];

  return (
    <Layout>
      <PageHeader
        title="Thanh toán & Hóa đơn"
        subtitle="Quản lý hóa đơn, thanh toán dịch vụ y tế"
        icon={Receipt}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> Tạo hóa đơn
          </button>
        }
      />

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <BillStatCard
          label="Chưa thanh toán"
          value={`${unpaidBills.length} hóa đơn`}
          icon={Clock}
          color="bg-red-50 text-red-700 border-red-200/60"
          sub={`${unpaidBills.reduce((s, b) => s + b.finalAmount, 0).toLocaleString('vi-VN')}đ tồn đọng`}
        />
        <BillStatCard
          label="Đã thanh toán"
          value={`${paidBills.length} hóa đơn`}
          icon={CheckCircle}
          color="bg-emerald-50 text-emerald-700 border-emerald-200/60"
        />
        <BillStatCard
          label="Doanh thu hôm nay"
          value={`${(todayRevenue / 1_000_000).toFixed(1)}M đ`}
          icon={DollarSign}
          color="bg-blue-50 text-blue-700 border-blue-200/60"
        />
      </div>

      {/* ── Filters ── */}
      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 pr-8"
              placeholder="Tìm bệnh nhân, mã hóa đơn..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={13} /></button>}
          </div>
          <select className="input-sm min-w-44" value={statusFilter} onChange={e => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span className="text-xs text-gray-400 ml-auto">{filteredBills.length} hóa đơn</span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card">
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}</div>
        ) : filteredBills.length === 0 ? (
          <EmptyState icon={Receipt} title="Chưa có hóa đơn nào" description="Tạo hóa đơn mới cho bệnh nhân." action={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={14} /> Tạo hóa đơn</button>} />
        ) : (
          <Table columns={columns as never} data={filteredBills as never} loading={false} />
        )}
      </div>

      {/* ── Create Bill Modal ── */}
      <Modal open={showModal} onClose={() => { setShowModal(false); reset(); }} title="Tạo hóa đơn mới" size="lg">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-5">
          {/* Patient */}
          <div>
            <label className="label">Bệnh nhân *</label>
            <select className="input" {...register('patientId', { required: true })}>
              <option value="">-- Chọn bệnh nhân --</option>
              {(patientsData as { id: string; name: string }[] ?? []).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Dịch vụ / Chi phí *</label>
              <button type="button" onClick={() => append({ serviceName: '', serviceType: 'SERVICE', price: 0, quantity: 1 })}
                className="text-xs text-primary-500 hover:text-primary-700 flex items-center gap-1 font-medium">
                <Plus size={12} /> Thêm dòng
              </button>
            </div>

            {/* Header */}
            <div className="grid grid-cols-12 gap-2 mb-1.5 px-0.5">
              <span className="col-span-5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Tên dịch vụ</span>
              <span className="col-span-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Loại</span>
              <span className="col-span-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Đơn giá</span>
              <span className="col-span-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">SL</span>
              <span className="col-span-1" />
            </div>

            <div className="space-y-2">
              {fields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl p-2">
                  <input
                    className="input col-span-5 bg-white"
                    placeholder="Tên dịch vụ / thuốc..."
                    {...register(`items.${i}.serviceName`, { required: true })}
                  />
                  <select className="input col-span-3 bg-white text-xs" {...register(`items.${i}.serviceType`)}>
                    {SERVICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input
                    type="number" min={0} step={1000}
                    className="input col-span-2 bg-white text-right"
                    placeholder="0"
                    {...register(`items.${i}.price`, { min: 0 })}
                  />
                  <input
                    type="number" min={1}
                    className="input col-span-1 bg-white text-center"
                    {...register(`items.${i}.quantity`, { min: 1, value: 1 })}
                  />
                  <button type="button" onClick={() => fields.length > 1 && remove(i)}
                    className="col-span-1 flex justify-center text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Chiết khấu (%)</label>
              <input type="number" min={0} max={100} className="input" placeholder="0" {...register('discount', { min: 0, max: 100 })} />
            </div>
            <div>
              <label className="label">Ghi chú</label>
              <input className="input" placeholder="Ghi chú thêm..." {...register('note')} />
            </div>
          </div>

          {/* Total summary */}
          <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-4 border border-primary-100">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span className="font-medium">{subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Chiết khấu ({watchDiscount}%)</span>
                  <span>-{discountAmt.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-primary-100">
                <span>Tổng cộng</span>
                <span className="text-primary-600 text-lg">{totalDue.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-1 border-t border-gray-50">
            <button type="button" onClick={() => { setShowModal(false); reset(); }} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={createMutation.isLoading} className="btn-primary">
              {createMutation.isLoading ? 'Đang tạo...' : 'Tạo hóa đơn'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Payment Modal ── */}
      <Modal open={!!payTarget} onClose={() => { setPayTarget(null); payForm.reset(); }} title="Ghi nhận thanh toán">
        {payTarget && (
          <form onSubmit={payForm.handleSubmit(d => payMutation.mutate({ id: payTarget.id, data: d }))} className="space-y-4">
            {/* Bill summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bệnh nhân</span>
                <span className="font-semibold">{payTarget.patient?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Số tiền cần thanh toán</span>
                <span className="font-bold text-lg text-primary-600">{payTarget.finalAmount.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            <div>
              <label className="label">Phương thức thanh toán *</label>
              <div className="grid grid-cols-1 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <label key={m.value} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-all">
                    <input type="radio" value={m.value} {...payForm.register('paymentMethod')} className="text-primary-500" />
                    <span className="text-sm font-medium">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Ghi chú</label>
              <input className="input" placeholder="Mã giao dịch, số séc..." {...payForm.register('note')} />
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-gray-50">
              <button type="button" onClick={() => { setPayTarget(null); payForm.reset(); }} className="btn-secondary">Hủy</button>
              <button type="submit" disabled={payMutation.isLoading} className="btn-primary">
                <CheckCircle size={15} />
                {payMutation.isLoading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── View Bill Detail Modal ── */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Chi tiết hóa đơn" size="lg">
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-gray-400 uppercase">{viewTarget.billCode}</p>
                <p className="font-bold text-gray-900 text-lg">{viewTarget.patient?.name}</p>
              </div>
              <StatusBadge status={viewTarget.paymentStatus} />
            </div>

            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-gray-500 font-semibold uppercase">Dịch vụ</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500 font-semibold uppercase">Đơn giá</th>
                    <th className="px-3 py-2 text-center text-xs text-gray-500 font-semibold uppercase">SL</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500 font-semibold uppercase">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {viewTarget.items?.map((it, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-3 py-2.5 text-gray-800">{it.serviceName}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{it.price.toLocaleString('vi-VN')}đ</td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{it.quantity}</td>
                      <td className="px-3 py-2.5 text-right font-medium">{it.total.toLocaleString('vi-VN')}đ</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t">
                  {viewTarget.discount > 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-right text-sm text-gray-500">Chiết khấu ({viewTarget.discount}%)</td>
                      <td className="px-3 py-2 text-right text-emerald-600 font-medium">
                        -{(viewTarget.totalAmount * viewTarget.discount / 100).toLocaleString('vi-VN')}đ
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="px-3 py-2.5 text-right font-bold text-gray-900">Tổng cộng</td>
                    <td className="px-3 py-2.5 text-right font-bold text-primary-600 text-base">
                      {viewTarget.finalAmount.toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {viewTarget.paymentMethod && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <CheckCircle size={15} className="text-emerald-500" />
                <span>Thanh toán qua: <strong>{viewTarget.paymentMethod}</strong></span>
                {viewTarget.paidAt && <span className="ml-auto text-xs text-gray-400">{format(new Date(viewTarget.paidAt), 'dd/MM/yyyy HH:mm')}</span>}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              {viewTarget.paymentStatus === 'UNPAID' && (
                <button
                  onClick={() => { setViewTarget(null); setPayTarget(viewTarget); }}
                  className="btn-primary"
                >
                  <CreditCard size={15} /> Thanh toán ngay
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="btn-secondary"
              >
                <Printer size={14} /> In hóa đơn
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}


