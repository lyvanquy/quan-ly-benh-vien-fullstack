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
import { useForm } from 'react-hook-form';
import {
  Plus, Search, FlaskConical, CheckCircle, Clock, X, Filter,
  AlertTriangle, ClipboardList, TestTube, Eye, Edit2,
} from 'lucide-react';
import { format } from 'date-fns';

interface LabTest {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  referenceRange: string;
}

interface LabOrderItem {
  id: string;
  test: LabTest;
  result: string | null;
  unit: string | null;
  referenceRange: string | null;
  isAbnormal: boolean;
  notes: string | null;
}

interface LabOrder {
  id: string;
  status: string;
  note: string;
  priority: string;
  createdAt: string;
  completedAt: string | null;
  patient: { id: string; name: string; patientCode: string; phone?: string };
  requestedBy?: { name: string };
  items: LabOrderItem[];
}

interface LabOrderForm {
  patientId: string;
  note: string;
  priority: string;
  testIds: string[];
}

interface ResultForm {
  items: { itemId: string; result: string; isAbnormal: boolean; notes: string }[];
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING:     { label: 'Chờ xử lý',   cls: 'badge badge-pending' },
  IN_PROGRESS: { label: 'Đang xử lý',  cls: 'badge badge-confirmed' },
  COMPLETED:   { label: 'Hoàn thành',  cls: 'badge badge-completed' },
  CANCELLED:   { label: 'Đã hủy',      cls: 'badge badge-cancelled' },
};

const PRIORITY_MAP: Record<string, { label: string; cls: string }> = {
  URGENT:   { label: '🔴 Khẩn cấp',    cls: 'badge bg-red-50 text-red-700 ring-1 ring-red-200' },
  PRIORITY: { label: '🟡 Ưu tiên',     cls: 'badge bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  NORMAL:   { label: '🟢 Bình thường', cls: 'badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
};

const TEST_CATEGORIES = [
  { category: 'Hủyết học', tests: ['Công thức máu toàn phần (CBC)', 'Đường huyết (Glucose)', 'HbA1c'] },
  { category: 'Sinh hóa', tests: ['Cholesterol toàn phần', 'Triglyceride', 'HDL-C', 'LDL-C', 'AST (GOT)', 'ALT (GPT)', 'Creatinine', 'Ure'] },
  { category: 'Nước tiểu', tests: ['Nước tiểu toàn phần (UA)', 'Cặn nước tiểu'] },
  { category: 'Tim mạch', tests: ['Điện tim đồ (ECG)', 'Troponin I', 'CK-MB'] },
  { category: 'Chẩn đoán hình ảnh', tests: ['X-Quang ngực thẳng', 'Siêu âm ổ bụng', 'Siêu âm tim'] },
  { category: 'Vi sinh', tests: ['Cấy máu', 'Cấy nước tiểu', 'Test nhanh COVID-19', 'Test nhanh cúm A/B'] },
];

// ─── Result Entry Modal ──────────────────────────────────────────────────────
function ResultModal({
  order, onClose,
}: {
  order: LabOrder | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [results, setResults] = useState<Record<string, { result: string; isAbnormal: boolean; notes: string }>>({});

  const submitMutation = useMutation(
    () => api.patch(`/lab/orders/${order?.id}/results`, {
      items: order?.items.map(item => ({
        itemId: item.id,
        result: results[item.id]?.result ?? '',
        isAbnormal: results[item.id]?.isAbnormal ?? false,
        notes: results[item.id]?.notes ?? '',
      })) ?? [],
    }),
    {
      onSuccess: () => {
        qc.invalidateQueries('lab-orders');
        toast.success('Nhập kết quả thành công');
        onClose();
      },
      onError: () => { toast.error('Nhập kết quả thất bại'); },
    }
  );

  if (!order) return null;

  return (
    <Modal open={!!order} onClose={onClose} title={`Nhập kết quả — ${order.patient?.name}`}>
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
          <TestTube size={14} className="shrink-0 mt-0.5" />
          <span>Nhập kết quả cho {order.items?.length ?? 0} chỉ số xét nghiệm. Đánh dấu bất thường nếu kết quả nằm ngoài giá trị tham chiếu.</span>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {order.items?.map(item => (
            <div key={item.id} className="border border-gray-100 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.test?.name}</p>
                  <p className="text-xs text-gray-400">{item.test?.code} · {item.test?.referenceRange && `Tham chiếu: ${item.test.referenceRange}`}</p>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-red-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={results[item.id]?.isAbnormal ?? false}
                    onChange={e => setResults(r => ({ ...r, [item.id]: { ...r[item.id], isAbnormal: e.target.checked } }))}
                    className="rounded"
                  />
                  Bất thường
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input text-sm"
                  placeholder={`Kết quả (${item.test?.unit ?? 'đơn vị'})`}
                  value={results[item.id]?.result ?? ''}
                  onChange={e => setResults(r => ({ ...r, [item.id]: { ...r[item.id], result: e.target.value } }))}
                />
                <input
                  className="input text-sm"
                  placeholder="Ghi chú"
                  value={results[item.id]?.notes ?? ''}
                  onChange={e => setResults(r => ({ ...r, [item.id]: { ...r[item.id], notes: e.target.value } }))}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-50">
          <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          <button
            type="button"
            disabled={submitMutation.isLoading}
            onClick={() => submitMutation.mutate()}
            className="btn-primary"
          >
            {submitMutation.isLoading ? 'Đang lưu...' : 'Lưu kết quả'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function LabPage() {
  const qc = useQueryClient();
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [priorityFilter, setPri]    = useState('');
  const [showAdd, setShowAdd]       = useState(false);
  const [resultOrder, setResultOrder] = useState<LabOrder | null>(null);
  const [viewOrder, setViewOrder]   = useState<LabOrder | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  const { register, handleSubmit, reset, setValue, watch } = useForm<LabOrderForm>({
    defaultValues: { priority: 'NORMAL', testIds: [] }
  });

  const { data, isLoading } = useQuery(
    ['lab-orders', search, statusFilter, priorityFilter],
    () => api.get('/lab/orders', {
      params: {
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      }
    }).then(r => r.data.data),
    { keepPreviousData: true }
  );

  const { data: patients = [] } = useQuery('lab-patients', () =>
    api.get('/patients', { params: { limit: 500 } }).then(r => {
      const d = r.data.data;
      return Array.isArray(d) ? d : (d?.patients ?? []);
    })
  );

  const createMutation = useMutation(
    (d: LabOrderForm) => api.post('/lab/orders', { ...d, testIds: selectedTests }),
    {
      onSuccess: () => {
        qc.invalidateQueries('lab-orders');
        toast.success('Tạo phiếu xét nghiệm thành công');
        setShowAdd(false);
        setSelectedTests([]);
        reset();
      },
      onError: () => { toast.error('Tạo phiếu thất bại'); },
    }
  );

  const updateStatusMutation = useMutation(
    ({ id, status }: { id: string; status: string }) => api.patch(`/lab/orders/${id}/status`, { status }),
    {
      onSuccess: () => { qc.invalidateQueries('lab-orders'); toast.success('Cập nhật trạng thái thành công'); },
      onError: () => { toast.error('Cập nhật thất bại'); },
    }
  );

  const orders: LabOrder[] = data?.orders ?? [];
  const stats = {
    pending:    orders.filter(o => o.status === 'PENDING').length,
    inProgress: orders.filter(o => o.status === 'IN_PROGRESS').length,
    completed:  orders.filter(o => o.status === 'COMPLETED').length,
    urgent:     orders.filter(o => o.priority === 'URGENT').length,
  };

  const toggleTest = (testName: string) => {
    setSelectedTests(prev =>
      prev.includes(testName) ? prev.filter(t => t !== testName) : [...prev, testName]
    );
  };

  const columns = [
    {
      key: 'patient', label: 'Bệnh nhân',
      render: (r: LabOrder) => (
        <EntityDialogLink entity="patient" id={r.patient?.id}>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{r.patient?.name}</p>
            <p className="text-xs text-gray-400">{r.patient?.patientCode}</p>
          </div>
        </EntityDialogLink>
      )
    },
    {
      key: 'priority', label: 'Mức độ',
      render: (r: LabOrder) => {
        const p = PRIORITY_MAP[r.priority] ?? PRIORITY_MAP['NORMAL'];
        return <span className={p.cls}>{p.label}</span>;
      }
    },
    {
      key: 'items', label: 'Xét nghiệm',
      render: (r: LabOrder) => (
        <div className="flex flex-wrap gap-1">
          {r.items?.slice(0, 2).map(it => (
            <span key={it.id}
              className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${it.isAbnormal ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}
            >
              {it.test?.code ?? it.test?.name}
            </span>
          ))}
          {(r.items?.length ?? 0) > 2 && (
            <span className="text-xs text-gray-400 px-1">+{r.items.length - 2} khác</span>
          )}
          {(r.items?.length ?? 0) === 0 && <span className="text-xs text-gray-300">—</span>}
        </div>
      )
    },
    {
      key: 'status', label: 'Trạng thái',
      render: (r: LabOrder) => {
        const s = STATUS_MAP[r.status] ?? { label: r.status, cls: 'badge' };
        return <span className={s.cls}>{s.label}</span>;
      }
    },
    {
      key: 'createdAt', label: 'Ngày tạo',
      render: (r: LabOrder) => (
        <div>
          <p className="text-sm text-gray-700">{format(new Date(r.createdAt), 'dd/MM/yyyy')}</p>
          <p className="text-xs text-gray-400">{format(new Date(r.createdAt), 'HH:mm')}</p>
        </div>
      )
    },
    {
      key: 'actions', label: '',
      render: (r: LabOrder) => (
        <div className="flex items-center gap-1.5">
          {/* View detail */}
          <button
            onClick={() => setViewOrder(r)}
            className="btn-icon w-7 h-7 text-gray-400 hover:text-primary-500"
            title="Xem chi tiết"
          >
            <Eye size={13} />
          </button>
          {/* Enter results */}
          {r.status === 'IN_PROGRESS' && (
            <button
              onClick={() => setResultOrder(r)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <Edit2 size={11} /> Nhập KQ
            </button>
          )}
          {/* Start processing */}
          {r.status === 'PENDING' && (
            <button
              onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'IN_PROGRESS' })}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              <Clock size={11} /> Xử lý
            </button>
          )}
          {/* Complete */}
          {r.status === 'IN_PROGRESS' && (
            <button
              onClick={() => updateStatusMutation.mutate({ id: r.id, status: 'COMPLETED' })}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle size={11} /> Hoàn thành
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <Layout>
      <PageHeader
        title="Xét nghiệm"
        subtitle="Quản lý phiếu xét nghiệm và kết quả"
        icon={FlaskConical}
        stats={[
          { label: 'chờ xử lý', value: stats.pending,    color: 'amber' },
          { label: 'đang xử lý', value: stats.inProgress, color: 'blue' },
          { label: 'hoàn thành', value: stats.completed,  color: 'emerald' },
        ]}
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus size={16} /> Tạo phiếu XN
          </button>
        }
      />

      {/* ── UrgentAlert ── */}
      {stats.urgent > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200/60 rounded-xl px-4 py-3 mb-5 text-red-700 text-sm">
          <AlertTriangle size={16} className="shrink-0 text-red-500" />
          <span>Có <strong>{stats.urgent}</strong> phiếu xét nghiệm <strong>khẩn cấp</strong> đang chờ xử lý!</span>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 pr-8"
              placeholder="Tìm theo tên bệnh nhân, mã..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <X size={13} />
              </button>
            )}
          </div>
          <select className="input-sm min-w-36" value={statusFilter} onChange={e => setStatus(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="IN_PROGRESS">Đang xử lý</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <select className="input-sm min-w-32" value={priorityFilter} onChange={e => setPri(e.target.value)}>
            <option value="">Tất cả mức độ</option>
            <option value="URGENT">Khẩn cấp</option>
            <option value="PRIORITY">Ưu tiên</option>
            <option value="NORMAL">Bình thường</option>
          </select>
          {(search || statusFilter || priorityFilter) && (
            <button
              onClick={() => { setSearch(''); setStatus(''); setPri(''); }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              <X size={12} /> Xóa lọc
            </button>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            Tổng: {data?.total ?? orders.length} phiếu
          </span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Chưa có phiếu xét nghiệm"
            description="Nhấn 'Tạo phiếu XN' để tạo phiếu xét nghiệm mới."
            action={
              <button onClick={() => setShowAdd(true)} className="btn-primary">
                <Plus size={14} /> Tạo phiếu XN
              </button>
            }
          />
        ) : (
          <Table columns={columns as never} data={orders as never} loading={false} />
        )}
      </div>

      {/* ── Create Modal ── */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); reset(); setSelectedTests([]); }}
        title="Tạo phiếu xét nghiệm"
      >
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          {/* Patient */}
          <div>
            <label className="label">Bệnh nhân *</label>
            <select className="input" {...register('patientId', { required: 'Bắt buộc chọn bệnh nhân' })}>
              <option value="">-- Chọn bệnh nhân --</option>
              {(patients as { id: string; name: string; patientCode?: string }[]).map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.patientCode ? ` (${p.patientCode})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="label">Mức độ ưu tiên</label>
            <div className="flex gap-2">
              {(['NORMAL', 'PRIORITY', 'URGENT'] as const).map(p => (
                <label key={p}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border-2 cursor-pointer text-xs font-semibold transition-all ${
                    watch('priority') === p
                      ? p === 'URGENT' ? 'border-red-400 bg-red-50 text-red-700'
                      : p === 'PRIORITY' ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <input type="radio" value={p} {...register('priority')} className="sr-only" />
                  {p === 'NORMAL' ? '🟢 Bình thường' : p === 'PRIORITY' ? '🟡 Ưu tiên' : '🔴 Khẩn cấp'}
                </label>
              ))}
            </div>
          </div>

          {/* Test Selection */}
          <div>
            <label className="label">Chọn xét nghiệm *</label>
            <div className="max-h-64 overflow-y-auto space-y-3 border border-gray-100 rounded-xl p-3">
              {TEST_CATEGORIES.map(cat => (
                <div key={cat.category}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{cat.category}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.tests.map(test => (
                      <button
                        key={test}
                        type="button"
                        onClick={() => toggleTest(test)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          selectedTests.includes(test)
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        {test}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {selectedTests.length > 0 && (
              <p className="text-xs text-primary-600 mt-1.5 font-medium">
                Đã chọn {selectedTests.length} xét nghiệm
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="label">Ghi chú / Triệu chứng</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Mô tả triệu chứng, tiền sử bệnh liên quan..."
              {...register('note')}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-50">
            <button type="button" onClick={() => { setShowAdd(false); reset(); setSelectedTests([]); }} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={createMutation.isLoading || selectedTests.length === 0} className="btn-primary">
              {createMutation.isLoading ? 'Đang tạo...' : 'Tạo phiếu XN'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── View Order Detail Modal ── */}
      {viewOrder && (
        <Modal open={!!viewOrder} onClose={() => setViewOrder(null)} title={`Chi tiết phiếu — ${viewOrder.patient?.name}`}>
          <div className="space-y-4">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Bệnh nhân</p>
                <p className="font-semibold text-gray-900">{viewOrder.patient?.name}</p>
                <p className="text-xs text-gray-500">{viewOrder.patient?.patientCode}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Trạng thái</p>
                <span className={STATUS_MAP[viewOrder.status]?.cls ?? 'badge'}>
                  {STATUS_MAP[viewOrder.status]?.label ?? viewOrder.status}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Ngày tạo</p>
                <p className="font-medium text-gray-800">{format(new Date(viewOrder.createdAt), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Mức độ</p>
                <span className={PRIORITY_MAP[viewOrder.priority]?.cls ?? 'badge'}>
                  {PRIORITY_MAP[viewOrder.priority]?.label ?? viewOrder.priority}
                </span>
              </div>
            </div>
            {viewOrder.note && (
              <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
                <p className="text-xs font-semibold text-blue-500 mb-1">Ghi chú</p>
                {viewOrder.note}
              </div>
            )}
            {/* Results table */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Kết quả xét nghiệm</p>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400">Xét nghiệm</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400">Kết quả</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400">Tham chiếu</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewOrder.items?.map(item => (
                      <tr key={item.id} className="border-b border-gray-50">
                        <td className="px-3 py-2">
                          <p className="font-medium text-gray-900">{item.test?.name}</p>
                          <p className="text-xs text-gray-400">{item.test?.code}</p>
                        </td>
                        <td className="px-3 py-2">
                          {item.result
                            ? <span className={`font-semibold ${item.isAbnormal ? 'text-red-600' : 'text-emerald-600'}`}>{item.result} {item.unit}</span>
                            : <span className="text-gray-300 text-xs">Chưa có</span>}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">{item.referenceRange ?? item.test?.referenceRange ?? '—'}</td>
                        <td className="px-3 py-2">
                          {item.result
                            ? item.isAbnormal
                              ? <span className="badge bg-red-50 text-red-700 ring-1 ring-red-200/60">⚠ Bất thường</span>
                              : <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">✓ Bình thường</span>
                            : <span className="badge bg-gray-100 text-gray-500">Chờ kết quả</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-gray-50">
              {viewOrder.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => { setResultOrder(viewOrder); setViewOrder(null); }}
                  className="btn-primary mr-2"
                >
                  <Edit2 size={14} /> Nhập kết quả
                </button>
              )}
              <button onClick={() => setViewOrder(null)} className="btn-secondary">Đóng</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Result Entry Modal ── */}
      <ResultModal order={resultOrder} onClose={() => setResultOrder(null)} />
    </Layout>
  );
}

