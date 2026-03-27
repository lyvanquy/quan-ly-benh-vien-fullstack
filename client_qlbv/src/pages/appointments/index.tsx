import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Table from '@/components/Table';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import EntityDialogLink from '@/components/EntityDialogLink';
import StatusBadge from '@/components/StatusBadge';

interface Appointment {
  id: string; appointmentDate: string; status: string; note: string;
  patient: { name: string; phone: string };
  doctor: { user: { name: string }; roomNumber: string };
}

interface ApptForm {
  patientId: string; doctorId: string; appointmentDate: string; note: string;
}

export default function AppointmentsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('');

  const { data, isLoading } = useQuery(
    ['appointments', dateFilter],
    () => api.get('/appointments', { params: { date: dateFilter || undefined } }).then(r => r.data.data)
  );

  const { data: doctors = [] } = useQuery('doctors', () => api.get('/doctors').then(r => r.data.data));
  const { data: patientsData } = useQuery('appt-patients', () =>
    api.get('/patients', { params: { limit: 100 } }).then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.patients ?? []); }));

  const { register, handleSubmit, reset } = useForm<ApptForm>();

  const createMutation = useMutation(
    (d: ApptForm) => api.post('/appointments', d),
    { onSuccess: () => { qc.invalidateQueries('appointments'); toast.success('Đặt lịch thành công'); setShowModal(false); reset(); } }
  );

  const updateStatus = useMutation(
    ({ id, status }: { id: string; status: string }) => api.put(`/appointments/${id}`, { status }),
    { onSuccess: () => { qc.invalidateQueries('appointments'); toast.success('Cập nhật trạng thái'); } }
  );

  const columns = [
    { key: 'patient', label: 'Benh nhan', render: (r: Appointment) => (
      <EntityDialogLink entity="patient" id={(r.patient as unknown as { id: string })?.id}>
        <div><p className="font-medium">{r.patient?.name}</p><p className="text-xs text-gray-400">{r.patient?.phone}</p></div>
      </EntityDialogLink>
    )},
    { key: 'doctor', label: 'Bac si', render: (r: Appointment) => (
      <div><p>{r.doctor?.user?.name}</p>{r.doctor?.roomNumber && <p className="text-xs text-gray-400">Phong {r.doctor.roomNumber}</p>}</div>
    )},
    { key: 'appointmentDate', label: 'Thoi gian', render: (r: Appointment) => (
      <EntityDialogLink entity="appointment" id={r.id}>
        {format(new Date(r.appointmentDate), 'dd/MM/yyyy HH:mm')}
      </EntityDialogLink>
    )},
    { key: 'status', label: 'Trang thai', render: (r: Appointment) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: '', render: (r: Appointment) => r.status === 'PENDING' ? (
        <div className="flex gap-2">
          <button onClick={() => updateStatus.mutate({ id: r.id, status: 'CONFIRMED' })} className="text-green-500 hover:text-green-700"><CheckCircle size={16} /></button>
          <button onClick={() => updateStatus.mutate({ id: r.id, status: 'CANCELLED' })} className="text-red-400 hover:text-red-600"><XCircle size={16} /></button>
        </div>
      ) : null
    },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch khám</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý lịch hẹn khám bệnh</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} />Đặt lịch</button>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <input type="date" className="input max-w-xs" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
          {dateFilter && <button onClick={() => setDateFilter('')} className="text-sm text-gray-400 hover:text-gray-600">Xóa lọc</button>}
          <span className="text-sm text-gray-500 ml-auto">Tổng: {data?.total ?? 0}</span>
        </div>
        <Table columns={columns as never} data={data?.appointments ?? []} loading={isLoading} />
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); reset(); }} title="Đặt lịch khám">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Bệnh nhân *</label>
            <select className="input" {...register('patientId', { required: true })}>
              <option value="">-- Chọn bệnh nhân --</option>
              {(patientsData as {id:string;name:string}[] ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Bác sĩ *</label>
            <select className="input" {...register('doctorId', { required: true })}>
              <option value="">-- Chọn bác sĩ --</option>
              {doctors.map((d: { id: string; user: { name: string }; specialty: string }) => <option key={d.id} value={d.id}>{d.user.name} - {d.specialty}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Ngày giờ khám *</label>
            <input type="datetime-local" className="input" {...register('appointmentDate', { required: true })} />
          </div>
          <div>
            <label className="label">Ghi chú</label>
            <textarea className="input" rows={3} {...register('note')} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => { setShowModal(false); reset(); }} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={createMutation.isLoading} className="btn-primary">{createMutation.isLoading ? 'Đang lưu...' : 'Đặt lịch'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
