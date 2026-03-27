import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Plus, FileText } from 'lucide-react';
import { format } from 'date-fns';
import EntityDialogLink from '@/components/EntityDialogLink';

interface RecordForm {
  patientId: string; doctorId: string; diagnosis: string; treatment: string; note: string;
}

export default function MedicalRecordsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset } = useForm<RecordForm>();

  const { data: records = [], isLoading } = useQuery('records', () => api.get('/records').then(r => r.data.data));
  const { data: doctors = [] } = useQuery('doctors', () => api.get('/doctors').then(r => r.data.data));
  const { data: patientsData } = useQuery('records-patients', () =>
    api.get('/patients', { params: { limit: 100 } }).then(r => { const d = r.data.data; return Array.isArray(d) ? d : (d?.patients ?? []); }));

  const createMutation = useMutation(
    (d: RecordForm) => api.post('/records', d),
    { onSuccess: () => { qc.invalidateQueries('records'); toast.success('Tạo hồ sơ thành công'); setShowModal(false); reset(); } }
  );

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ bệnh án</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý hồ sơ và chẩn đoán</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} />Tạo hồ sơ</button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : (
        <div className="space-y-3">
          {records.map((r: Record<string, unknown>) => (
            <div key={r.id as string} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mt-0.5">
                    <FileText size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      <EntityDialogLink entity="patient" id={(r.patient as { id: string })?.id}>{(r.patient as { name: string })?.name}</EntityDialogLink>
                    </p>
                    <p className="text-sm text-gray-500">BS. <EntityDialogLink entity="doctor" id={(r.doctor as { id: string })?.id}>{(r.doctor as { user: { name: string } })?.user?.name}</EntityDialogLink></p>
                    <p className="text-sm mt-2"><span className="text-gray-500">Chẩn đoán:</span> {r.diagnosis as string}</p>
                    {!!r.treatment && <p className="text-sm"><span className="text-gray-500">Điều trị:</span> {String(r.treatment)}</p>}
                  </div>
                </div>
                <span className="text-xs text-gray-400">{format(new Date(r.createdAt as string), 'dd/MM/yyyy')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => { setShowModal(false); reset(); }} title="Tạo hồ sơ bệnh án">
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
            <label className="label">Chẩn đoán *</label>
            <textarea className="input" rows={2} {...register('diagnosis', { required: true })} />
          </div>
          <div>
            <label className="label">Phương pháp điều trị</label>
            <textarea className="input" rows={2} {...register('treatment')} />
          </div>
          <div>
            <label className="label">Ghi chú</label>
            <textarea className="input" rows={2} {...register('note')} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => { setShowModal(false); reset(); }} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={createMutation.isLoading} className="btn-primary">{createMutation.isLoading ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
