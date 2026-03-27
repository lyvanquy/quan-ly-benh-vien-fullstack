import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { CalendarDays, CheckCircle, XCircle, Clock, User, Stethoscope } from 'lucide-react';
import EntityDialogLink from '@/components/EntityDialogLink';
import { DialogFrame } from '@/store/entityDialogStore';
import { useForm } from 'react-hook-form';
import StatusBadge from '@/components/StatusBadge';

interface Props { frame: DialogFrame; onClose: () => void; }

export default function AppointmentDialog({ frame, onClose }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset } = useForm<{ patientId: string; doctorId: string; appointmentDate: string; note: string }>();

  const isCreate = frame.mode === 'create';

  const { data: appt, isLoading } = useQuery(
    ['appt-dlg', frame.id],
    () => api.get(`/appointments/${frame.id}`).then(r => r.data.data),
    { enabled: !!frame.id && !isCreate }
  );

  const { data: patientsData } = useQuery('patients-list-dlg', () => api.get('/patients?limit=200').then(r => r.data.data), { enabled: isCreate });
  const { data: doctorsData } = useQuery('doctors-list-dlg', () => api.get('/doctors?limit=200').then(r => r.data.data), { enabled: isCreate });

  const createMut = useMutation(
    (d: Record<string, string>) => api.post('/appointments', d),
    { onSuccess: () => { qc.invalidateQueries('appointments'); qc.invalidateQueries(['patient-dlg-appts', frame.ctx?.patientId]); onClose(); reset(); } }
  );

  const updateStatus = useMutation(
    (status: string) => api.put(`/appointments/${frame.id}`, { status }),
    { onSuccess: () => { qc.invalidateQueries(['appt-dlg', frame.id]); qc.invalidateQueries('appointments'); } }
  );

  if (isCreate) {
    const patients = patientsData?.patients || [];
    const doctors = doctorsData?.doctors || [];
    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><CalendarDays size={20} /></div>
          <h2 className="text-lg font-bold text-gray-900">Dat lich kham moi</h2>
        </div>
        <form onSubmit={handleSubmit(d => createMut.mutate({ ...d, ...(frame.ctx?.patientId ? { patientId: frame.ctx.patientId as string } : {}) }))} className="space-y-4">
          {!frame.ctx?.patientId && (
            <div>
              <label className="label">Benh nhan *</label>
              <select className="input" {...register('patientId', { required: true })}>
                <option value="">-- Chon benh nhan --</option>
                {patients.map((p: Record<string, string>) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Bac si *</label>
            <select className="input" {...register('doctorId', { required: true })}>
              <option value="">-- Chon bac si --</option>
              {doctors.map((d: Record<string, unknown>) => (
                <option key={d.id as string} value={d.id as string}>{(d.user as Record<string, string>)?.name} — {d.specialty as string}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Ngay gio kham *</label>
            <input type="datetime-local" className="input" {...register('appointmentDate', { required: true })} />
          </div>
          <div>
            <label className="label">Ghi chu</label>
            <textarea className="input" rows={2} {...register('note')} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Huy</button>
            <button type="submit" disabled={createMut.isLoading} className="btn-primary">{createMut.isLoading ? 'Dang luu...' : 'Dat lich'}</button>
          </div>
        </form>
      </div>
    );
  }

  if (isLoading) return <div className="flex items-center justify-center h-48 text-gray-400">Dang tai...</div>;
  if (!appt) return <div className="text-center py-12 text-gray-400">Khong tim thay lich kham</div>;

  return (
    <div>
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><CalendarDays size={22} /></div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900">{format(new Date(appt.appointmentDate), 'dd/MM/yyyy HH:mm')}</h2>
          <div className="mt-1"><StatusBadge status={appt.status} /></div>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <User size={16} className="text-gray-400" />
          <div>
            <p className="text-xs text-gray-400">Benh nhan</p>
            <EntityDialogLink entity="patient" id={appt.patient?.id}>
              <p className="text-sm font-medium text-primary">{appt.patient?.name}</p>
            </EntityDialogLink>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <Stethoscope size={16} className="text-gray-400" />
          <div>
            <p className="text-xs text-gray-400">Bac si</p>
            <EntityDialogLink entity="doctor" id={appt.doctor?.id}>
              <p className="text-sm font-medium text-primary">BS. {appt.doctor?.user?.name}</p>
            </EntityDialogLink>
            {appt.doctor?.specialty && <p className="text-xs text-gray-500">{appt.doctor.specialty}</p>}
          </div>
        </div>
        {appt.note && (
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-1">Ghi chu</p>
            <p className="text-sm text-gray-700">{appt.note}</p>
          </div>
        )}
        {appt.queueNumber && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
            <Clock size={16} className="text-blue-500" />
            <div>
              <p className="text-xs text-blue-400">So thu tu</p>
              <p className="text-lg font-bold text-blue-700">#{appt.queueNumber}</p>
            </div>
          </div>
        )}
      </div>

      {/* Status actions */}
      {appt.status === 'PENDING' && (
        <div className="flex gap-2">
          <button onClick={() => updateStatus.mutate('CONFIRMED')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100">
            <CheckCircle size={16} /> Xac nhan
          </button>
          <button onClick={() => updateStatus.mutate('CANCELLED')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-700 rounded-xl text-sm font-medium hover:bg-red-100">
            <XCircle size={16} /> Huy lich
          </button>
        </div>
      )}
      {appt.status === 'CONFIRMED' && (
        <div className="flex gap-2">
          <button onClick={() => updateStatus.mutate('CHECKED_IN')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-100">
            Check-in
          </button>
          <button onClick={() => updateStatus.mutate('COMPLETED')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-medium hover:bg-green-100">
            <CheckCircle size={16} /> Hoan thanh
          </button>
        </div>
      )}
    </div>
  );
}
