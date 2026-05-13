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
  Plus, CalendarDays, CheckCircle, XCircle, Clock,
  Search, X, Filter, ChevronDown, Users
} from 'lucide-react';
import { format, isToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface Appointment {
  id: string; appointmentDate: string; status: string; note: string;
  patient: { id: string; name: string; phone: string };
  doctor: { id: string; user: { name: string }; specialty: string; roomNumber?: string };
}

interface ApptForm {
  patientId: string; doctorId: string; appointmentDate: string; note: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING',     label: 'Chờ xác nhận' },
  { value: 'CONFIRMED',   label: 'Đã xác nhận' },
  { value: 'CHECKED_IN',  label: 'Đã check-in' },
  { value: 'IN_PROGRESS', label: 'Đang khám' },
  { value: 'COMPLETED',   label: 'Hoàn thành' },
  { value: 'CANCELLED',   label: 'Đã hủy' },
  { value: 'NO_SHOW',     label: 'Vắng mặt' },
];

const DATE_RANGES = [
  { value: '', label: 'Tất cả ngày' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'week',  label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
];

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className={`rounded-2xl p-4 border flex items-center gap-4 ${color}`}>
      <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs mt-0.5 opacity-80">{label}</p>
      </div>
    </div>
  );
}

// Inline status flow buttons
function StatusActions({ appt, onUpdate }: { appt: Appointment; onUpdate: (id: string, status: string) => void }) {
  const NEXT: Record<string, { status: string; label: string; cls: string }[]> = {
    PENDING:     [{ status: 'CONFIRMED', label: 'Xác nhận', cls: 'text-blue-500 hover:text-blue-700' }, { status: 'CANCELLED', label: 'Hủy', cls: 'text-red-400 hover:text-red-600' }],
    CONFIRMED:   [{ status: 'CHECKED_IN', label: 'Check-in', cls: 'text-indigo-500 hover:text-indigo-700' }, { status: 'CANCELLED', label: 'Hủy', cls: 'text-red-400 hover:text-red-600' }],
    CHECKED_IN:  [{ status: 'IN_PROGRESS', label: 'Bắt đầu khám', cls: 'text-teal-500 hover:text-teal-700' }],
    IN_PROGRESS: [{ status: 'COMPLETED', label: 'Hoàn thành', cls: 'text-emerald-500 hover:text-emerald-700' }],
  };

  const actions = NEXT[appt.status] || [];
  if (!actions.length) return null;
  return (
    <div className="flex gap-1.5">
      {actions.map(a => (
        <button key={a.status} onClick={() => onUpdate(appt.id, a.status)} className={`text-xs font-medium ${a.cls}`}>
          {a.label}
        </button>
      ))}
    </div>
  );
}

export default function AppointmentsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal]   = useState(false);
  const [statusFilter, setStatus]   = useState('');
  const [dateRange, setDateRange]   = useState('today');
  const [search, setSearch]         = useState('');
  const [confirmId, setConfirmId]   = useState<{ id: string; status: string } | null>(null);

  const { data, isLoading } = useQuery(
    ['appointments', statusFilter, dateRange],
    () => api.get('/appointments', {
      params: {
        status: statusFilter || undefined,
        range: dateRange || undefined,
      }
    }).then(r => r.data.data)
  );

  const { data: doctors = [] } = useQuery('doctors', () => api.get('/doctors').then(r => r.data.data));
  const { data: patientsResp } = useQuery('appt-patients', () =>
    api.get('/patients', { params: { limit: 200 } }).then(r => {
      const d = r.data.data;
      return Array.isArray(d) ? d : (d?.patients ?? []);
    }));
  const patientsList: { id: string; name: string }[] = patientsResp ?? [];

  const { register, handleSubmit, reset } = useForm<ApptForm>();

  const createMutation = useMutation(
    (d: ApptForm) => api.post('/appointments', d),
    {
      onSuccess: () => {
        qc.invalidateQueries('appointments');
        toast.success('Đặt lịch thành công');
        setShowModal(false);
        reset();
      },
      onError: () => { toast.error('Đặt lịch thất bại'); },
    }
  );

  const updateStatus = useMutation(
    ({ id, status }: { id: string; status: string }) => api.put(`/appointments/${id}`, { status }),
    {
      onSuccess: () => {
        qc.invalidateQueries('appointments');
        toast.success('Cập nhật trạng thái thành công');
        setConfirmId(null);
      },
      onError: () => { toast.error('Cập nhật thất bại'); },
    }
  );

  const allAppts: Appointment[] = data?.appointments ?? [];

  // Client-side search filter
  const appointments = search
    ? allAppts.filter(a =>
        a.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.doctor?.user?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : allAppts;

  // Stats from all appts (no search filter)
  const stats = {
    pending:   allAppts.filter(a => a.status === 'PENDING').length,
    confirmed: allAppts.filter(a => a.status === 'CONFIRMED').length,
    today:     allAppts.filter(a => a.appointmentDate && isToday(new Date(a.appointmentDate))).length,
  };

  const columns = [
    {
      key: 'patient', label: 'Bệnh nhân',
      render: (r: Appointment) => (
        <EntityDialogLink entity="patient" id={r.patient?.id}>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{r.patient?.name}</p>
            <p className="text-xs text-gray-400">{r.patient?.phone}</p>
          </div>
        </EntityDialogLink>
      )
    },
    {
      key: 'doctor', label: 'Bác sĩ',
      render: (r: Appointment) => (
        <div>
          <p className="text-sm font-medium text-gray-800">{r.doctor?.user?.name}</p>
          <p className="text-xs text-gray-400">{r.doctor?.specialty}</p>
          {r.doctor?.roomNumber && <p className="text-xs text-primary-500">Phòng {r.doctor.roomNumber}</p>}
        </div>
      )
    },
    {
      key: 'appointmentDate', label: 'Ngày giờ',
      render: (r: Appointment) => (
        <EntityDialogLink entity="appointment" id={r.id}>
          <div>
            <p className="text-sm font-medium text-gray-900">{format(new Date(r.appointmentDate), 'HH:mm')}</p>
            <p className="text-xs text-gray-400">{format(new Date(r.appointmentDate), 'dd/MM/yyyy')}</p>
          </div>
        </EntityDialogLink>
      )
    },
    { key: 'status', label: 'Trạng thái', render: (r: Appointment) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: '',
      render: (r: Appointment) => (
        <StatusActions
          appt={r}
          onUpdate={(id, status) => {
            if (status === 'CANCELLED') {
              setConfirmId({ id, status });
            } else {
              updateStatus.mutate({ id, status });
            }
          }}
        />
      )
    },
  ];

  return (
    <Layout>
      <PageHeader
        title="Lịch khám"
        subtitle="Quản lý lịch hẹn khám bệnh"
        icon={CalendarDays}
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> Đặt lịch mới
          </button>
        }
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard label="Chờ xác nhận" value={stats.pending}   icon={Clock}        color="bg-amber-50  text-amber-700 border-amber-200/60" />
        <StatCard label="Đã xác nhận"  value={stats.confirmed} icon={CheckCircle}  color="bg-blue-50   text-blue-700 border-blue-200/60" />
        <StatCard label="Hôm nay"      value={stats.today}     icon={CalendarDays} color="bg-emerald-50 text-emerald-700 border-emerald-200/60" />
      </div>

      {/* ── Filters ── */}
      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 pr-8"
              placeholder="Tìm bệnh nhân, bác sĩ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status filter */}
          <select className="input-sm min-w-40" value={statusFilter} onChange={e => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Date range */}
          <select className="input-sm min-w-32" value={dateRange} onChange={e => setDateRange(e.target.value)}>
            {DATE_RANGES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Clear filters */}
          {(statusFilter || dateRange || search) && (
            <button
              onClick={() => { setStatus(''); setDateRange(''); setSearch(''); }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              <X size={13} /> Xóa lọc
            </button>
          )}

          <span className="text-xs text-gray-400 ml-auto">{appointments.length} lịch hẹn</span>
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
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Không có lịch hẹn"
            description="Chưa có lịch hẹn nào trong khoảng thời gian này."
            action={
              <button onClick={() => setShowModal(true)} className="btn-primary">
                <Plus size={14} /> Đặt lịch mới
              </button>
            }
          />
        ) : (
          <Table columns={columns as never} data={appointments as never} loading={false} />
        )}
      </div>

      {/* ── Book Modal ── */}
      <Modal open={showModal} onClose={() => { setShowModal(false); reset(); }} title="Đặt lịch khám mới">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Bệnh nhân *</label>
            <select className="input" {...register('patientId', { required: true })}>
              <option value="">-- Chọn bệnh nhân --</option>
              {patientsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Bác sĩ *</label>
            <select className="input" {...register('doctorId', { required: true })}>
              <option value="">-- Chọn bác sĩ --</option>
              {(doctors as { id: string; user: { name: string }; specialty: string }[]).map(d => (
                <option key={d.id} value={d.id}>{d.user.name} — {d.specialty}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Ngày giờ khám *</label>
            <input type="datetime-local" className="input" {...register('appointmentDate', { required: true })} />
          </div>
          <div>
            <label className="label">Ghi chú / Triệu chứng</label>
            <textarea className="input" rows={3} placeholder="Mô tả triệu chứng, lý do khám..." {...register('note')} />
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-50">
            <button type="button" onClick={() => { setShowModal(false); reset(); }} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={createMutation.isLoading} className="btn-primary">
              {createMutation.isLoading ? 'Đang lưu...' : 'Đặt lịch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm Cancel ── */}
      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && updateStatus.mutate(confirmId)}
        isLoading={updateStatus.isLoading}
        title="Hủy lịch hẹn"
        message="Bạn có chắc muốn hủy lịch hẹn này? Bệnh nhân sẽ cần đặt lại lịch."
        confirmText="Hủy lịch"
      />
    </Layout>
  );
}


